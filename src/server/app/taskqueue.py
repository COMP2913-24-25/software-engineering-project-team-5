from app import app, db, stripe, socketio
import datetime
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Models and other imports
from .models import (
    User,
    Address,
    Payment,
    Items,
    Images,
    Middle_type,
    Types,
    Watchlist,
    Bidding_history,
    Profit_structure,
    Availabilities,
    Middle_expertise,
    ScheduledTask,
)

# Email setup
from flask_mail import Mail, Message

app.config["MAIL_SERVER"] = "smtp.fastmail.com"
app.config["MAIL_PORT"] = 465
app.config["MAIL_USERNAME"] = "ebuy@fastmail.com"
app.config["MAIL_PASSWORD"] = "3d3y6d472e2j7635"
app.config["MAIL_USE_TLS"] = False
app.config["MAIL_USE_SSL"] = True
app.config["MAIL_DEFAULT_SENDER"] = "ebuy@fastmail.com"
mail = Mail(app)

# Initialize scheduler
scheduler = BackgroundScheduler()


def init_scheduler():
    """
    Initialize the scheduler with the Flask app context
    """

    if not scheduler.running:
        scheduler.app = app

        # Create tables if they don't exist
        with app.app_context():
            db.create_all()

        # Check for pending tasks every 3 seconds
        scheduler.add_job(
            process_task_queue,
            trigger=IntervalTrigger(seconds=3),
            id="task_queue_processor",
        )
        scheduler.start()


def schedule_auction(item):
    """
    Schedule an auction to end at its Available_until time
    """

    with scheduler.app.app_context():
        task = ScheduledTask(
            task_name="process_auction_ending",
            task_args={"item_id": item.Item_id},
            execute_at=item.Available_until,
            completed=False,
        )
        db.session.add(task)
        db.session.commit()


def process_task_queue():
    """
    Check for tasks that are due to execute
    """

    with scheduler.app.app_context():
        now = datetime.now(timezone.utc)
        due_tasks = ScheduledTask.query.filter(
            ScheduledTask.execute_at <= now, ScheduledTask.completed == False
        ).all()

        for task in due_tasks:
            try:
                if task.task_name == "process_auction_ending":
                    item = Items.query.filter_by(
                        Item_id=task.task_args["item_id"]
                    ).first()
                    if item:
                        handle_auction_ending(item)

                db.session.delete(task)
                db.session.commit()

            except Exception as e:
                db.session.rollback()


def handle_auction_ending(item):
    """
    Handle the auction ending logic
    """

    try:
        # Get winning bid
        winning_bid = (
            Bidding_history.query.filter_by(Item_id=item.Item_id)
            .order_by(Bidding_history.Bid_price.desc())
            .first()
        )

        if not winning_bid:
            return

        # Process payment
        charge_success = charge_expired_auction(winning_bid)
        if not charge_success:
            raise Exception("Payment processing failed")

        # Update item and bid status
        item.Sold = True
        winning_bid.Winning_bid = True

        db.session.add(item)
        db.session.add(winning_bid)

        # Send notifications
        send_auction_notifications(item, winning_bid)

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        raise


def send_auction_notifications(item, winning_bid):
    """
    Send socket.io notifications
    """

    try:
        # Notify winner
        socketio.emit(
            "auction_won",
            {
                "item_id": item.Item_id,
                "item_name": item.Listing_name,
                "winning_price": winning_bid.Bid_price,
            },
            room=f"user_{winning_bid.Bidder_id}",
        )

        # Notify losers
        losing_bids = Bidding_history.query.filter(
            Bidding_history.Item_id == item.Item_id,
            Bidding_history.Bidder_id != winning_bid.Bidder_id,
        ).all()

        for bid in losing_bids:
            socketio.emit(
                "auction_lost",
                {
                    "item_id": item.Item_id,
                    "item_name": item.Listing_name,
                    "winning_price": winning_bid.Bid_price,
                },
                room=f"user_{bid.Bidder_id}",
            )

    except Exception as e:
        pass


def send_email(recipient, subject, body):
    """
    Sends an email to the specified recipient with the given subject and body.

    Args:
    - subject (str): The subject of the email.
    - recipient (str): The email address of the recipient.
    - body (str): The body of the email.
    """
    try:
        msg = Message(subject, recipients=[recipient])
        msg.body = body
        mail.send(msg)
        print("Email sent successfully (in send_email!\n")
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def charge_user(
    user_tbc,
    bid_price,
):
    """
    Args:
    - user_tbc: user to be charged
    - bid_price: price to be charged
    Charges the user for an auction item

    Returns:
        json_object: message to the user saying success"""
    # currently will just do user who is logged in
    # later will use item id of finished auction and the user id to charge the correct user
    # use item id to find most recent bid and get:
    # -bidder id
    # -bid price
    # -if successful bid
    # bidder_id = None # user id to be charged
    try:

        payment_intent = stripe.PaymentIntent.create(
            amount=int(bid_price * 100),  # convert to pence
            currency="gbp",
            confirm=True,
            customer=user_tbc.Customer_ID,
            payment_method=user_tbc.Payment_method_ID,
            receipt_email=user_tbc.Email,
            automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
        )
        print("Charged user in charge_user()!\n")
        return {
            "payment_intent_id": payment_intent.id,
            "client_secret": payment_intent.client_secret,
            "status": payment_intent.status,
            "success": True,
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"error": "Failed to charge user", "success": False}


def charge_expired_auction(bid_details):
    """
    Check expired auctions and charge the highest bidder for each item.
    """
    bidder = User.query.filter_by(User_id=bid_details.Bidder_id).first()
    bid_price = bid_details.Bid_price

    if bidder:
        # Call the charge function
        try:
            charge_response = charge_user(bidder, bid_price)
            if charge_response["success"] == True:

                # After charging the user, update the item status: Sold = True
                item = Items.query.filter_by(Item_id=bid_details.Item_id).first()
                item.Sold = True
                bid_details.Winning_bid = True

                db.session.commit()
                # send email to user
                email_body = (
                    "Congratulations "
                    + bidder.First_name
                    + "! You have won the auction for the item "
                    + item.Listing_name
                    + " at a price of £"
                    + str(bid_price)
                    + "."
                )

                email_sent = send_email(bidder.Email, "Auction Won!", email_body)

                if email_sent == True:
                    print("Email sent successfully!\n")
                    return True
                else:
                    print("Error sending email!\n")
                    raise Exception("Failed to send email")

            else:
                raise Exception("Failed to charge user")

        except Exception as e:
            pass


# Milas Code - not used
# @app.route("/api/charge-manual", methods=["POST"])
# def charge_manual():
#     """
#     API endpoint to manually trigger the charge_expired_auctions function.
#     """
#     try:
#         charge_expired_auctions()
#         return jsonify({"message": "Processed expired auctions"}), 200
#     except Exception as e:
#         print(f"Error processing expired auctions: {e}")
#         return jsonify({"error": "Failed to process expired auctions"}), 500

init_scheduler()
