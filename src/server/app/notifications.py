from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
from flask_login import current_user
from app import db, socketio
from app.models import Bidding_history, Items, User
import datetime


@socketio.on("connect")
def handle_notification_connect():
    if not current_user.is_authenticated:
        return False


@socketio.on("join_notifications")
def handle_join_notifications():
    if current_user.is_authenticated:
        join_room(f"user_{current_user.User_id}")


@socketio.on("join_get_bids")
def handle_join_get_bids():
    if current_user.is_authenticated:
        join_room(f"bid_updates_{current_user.User_id}")


@socketio.on("place_bid")
def handle_place_bid(data):
    """
    Handle new bids and notify outbid users
    """
    if not current_user.is_authenticated:
        return

    item_id = data["item_id"]
    bid_amount = data["bid_amount"]

    # Get the current highest bidder
    current_highest_bid = (
        Bidding_history.query.filter_by(Item_id=item_id)
        .order_by(Bidding_history.Bid_price.desc())
        .first()
    )

    if not current_highest_bid:
        return None

    # Get the previous highest bid (second highest bid after current highest bid)
    previous_bid = (
        Bidding_history.query.filter(
            Bidding_history.Item_id == item_id,
            Bidding_history.Bid_id != current_highest_bid.Bid_id,
        )
        .order_by(Bidding_history.Bid_price.desc())
        .first()
    )

    item = Items.query.get(item_id)

    if previous_bid and previous_bid.Bidder_id != current_user.User_id:
        # Notify the previous bidder they've been outbid
        emit(
            "outbid_notification",
            {
                "item_id": item_id,
                "item_name": item.Listing_name,
                "outbid_price": bid_amount,
            },
            room=f"user_{previous_bid.Bidder_id}",
        )

    # Notify all users about the update
    # The bid_update event is used in enlargedlisting.jsx to update the current bid
    # displayed to the user and is also used in the currentbids.jsx file to show
    # whether the user is the current highest bidder
    for user in User.query.all():
        bidder_id = user.User_id
        emit(
            "bid_update",
            room=f"bid_updates_{bidder_id}",
        )


@socketio.on("auction_ended")
def handle_auction_ended(data):
    """
    Notify users when an auction ends
    """
    item_id = data["item_id"]
    item = Items.query.get(item_id)

    if not item:
        return

    # Get the winning bid
    winning_bid = (
        Bidding_history.query.filter_by(Item_id=item_id)
        .order_by(Bidding_history.Bid_price.desc())
        .first()
    )

    if winning_bid:
        # Notify the winner
        emit(
            "auction_won",
            {
                "item_id": item_id,
                "item_name": item.Listing_name,
                "winning_price": winning_bid.Bid_price,
            },
            room=f"user_{winning_bid.Bidder_id}",
        )

        # Notify all other bidders
        losing_bidders = Bidding_history.query.filter(
            Bidding_history.Item_id == item_id,
            Bidding_history.Bidder_id != winning_bid.Bidder_id,
        ).all()

        for bid in losing_bidders:
            emit(
                "auction_lost",
                {
                    "item_id": item_id,
                    "item_name": item.Listing_name,
                    "winning_price": winning_bid.Bid_price,
                },
                room=f"user_{bid.Bidder_id}",
            )


@socketio.on("auth_request_assigned")
def handle_auth_request_assigned(data):
    """
    Notify expert when a new authentication request is assigned
    """
    expert_id = data["expert_id"]
    item_id = data["item_id"]
    item = Items.query.get(item_id)

    if item:
        emit(
            "new_auth_request",
            {"item_id": item_id, "item_name": item.Listing_name},
            room=f"user_{expert_id}",
        )
