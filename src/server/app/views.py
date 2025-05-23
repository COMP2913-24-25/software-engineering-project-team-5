from app import app, db, admin, stripe
from app.notifications import *
import base64
import datetime
from app.taskqueue import schedule_auction

# Flask related imports
from flask import (
    render_template,
    flash,
    request,
    redirect,
    url_for,
    send_file,
    Flask,
    jsonify,
    session,
    json,
)
from flask_admin.contrib.sqla import ModelView
from flask_login import login_user, login_required, logout_user, current_user
from flask_wtf.csrf import generate_csrf
from sqlalchemy.orm import sessionmaker
from sqlalchemy import and_, exists

# Cache related imports
from sqlalchemy.orm import joinedload
from flask_caching import Cache

cache = Cache(app, config={"CACHE_TYPE": "simple"})

# Models, forms and database related imports
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
)
from .forms import login_form, sign_up_form, Create_listing_form, update_user_form
from sqlalchemy.orm import aliased
from sqlalchemy import func

# Security related imports
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename


# Debug and loggin related imports
import traceback
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Admin mode accessed using "http://<url>/admin"
# Used to view database on website instead of app.db
admin.add_view(ModelView(User, db.session))
admin.add_view(ModelView(Address, db.session))
admin.add_view(ModelView(Payment, db.session))
admin.add_view(ModelView(Items, db.session))
admin.add_view(ModelView(Images, db.session))
admin.add_view(ModelView(Middle_type, db.session))
admin.add_view(ModelView(Types, db.session))
admin.add_view(ModelView(Watchlist, db.session))
admin.add_view(ModelView(Bidding_history, db.session))
admin.add_view(ModelView(Profit_structure, db.session))
admin.add_view(ModelView(Middle_expertise, db.session))
admin.add_view(ModelView(Availabilities, db.session))


@app.route("/api/login", methods=["POST"])
def login():
    """
    Retrieves the users login information, and checks it against
    the database to log the user in. Stores logged in state as session
    data.

    Returns:
        json_object: successful login message, and user information
        status_code: HTTP status code (200 for success,
                                       400 for validation error).
    """
    # Requests the data from the front end as a JSON string.
    data = request.json

    # Create a form from the received data and validate it.
    form = login_form(data=data)

    errors = {}
    # Validate the form and collect any errors
    if not form.validate():
        for field, messages in form.errors.items():
            errors[field] = messages

    # Check if the users email or username exists
    user_exists = User.query.filter_by(Email=data["email_or_username"]).first()
    if not user_exists:
        user_exists = User.query.filter_by(Username=data["email_or_username"]).first()

    # Validate the user's credentials
    if not user_exists:
        errors["email_or_username"] = ["User not found"]
    elif not check_password_hash(user_exists.Password, data["password"]):
        errors["password"] = ["Incorrect password"]

    # If there are any errors, return them, and return and error code of 400
    if errors:
        return jsonify({"errors": errors}), 400

    # Log the user in if everything is correct
    login_user(user_exists, remember=True)

    # Return a success message and a status code of 200 (ok)
    return (
        jsonify(
            {
                "message": "Login successful",
                "user": {
                    "user_id": user_exists.User_id,
                    "first_name": user_exists.First_name,
                    "level_of_access": user_exists.Level_of_access,
                    "is_expert": user_exists.Is_expert,
                },
            }
        ),
        200,
    )


@app.route("/api/signup", methods=["POST"])
def signup():
    """
    Creates a new user in the database using the provided data,
    and logs the user in.

    Returns:
        json_object: message to the user saying success
        status_code: HTTP status code (200 for success,
                                       400 for validation errors)
    """
    data = request.json
    form = sign_up_form(data=data)
    errors = {}

    if User.query.filter_by(Email=data["email"]).first():
        errors["email"] = ["Email already exists"]

    if User.query.filter_by(Username=data["username"]).first():
        errors["username"] = ["Username already exists"]

    if data["password"] != data["password_confirmation"]:
        errors["password_confirmation"] = ["Passwords do not match"]

    if not form.validate():
        for field, messages in form.errors.items():
            errors[field] = messages

    if errors:
        return jsonify({"errors": errors}), 400

    # Converts DOB to date object
    DOB = datetime.datetime.strptime(data["DOB"], "%Y-%m-%d").date()

    # Creates a new user with given data
    user = User(
        First_name=data["first_name"].capitalize(),
        Middle_name=(
            None
            if data["middle_name"].strip() == ""
            else data["middle_name"].capitalize()
        ),
        Surname=data["surname"].capitalize(),
        DOB=DOB,
        Username=data["username"],
        Email=data["email"],
        Password=generate_password_hash(data["password"]),
        Level_of_access=1,
        Is_expert=False,
    )

    # Adds the user to the database and commits the changes
    db.session.add(user)
    db.session.commit()

    # Logs in user
    login_user(user, remember=True)

    # Returns a success message and a status code of 200 (ok)
    return jsonify({"message": "User created successfully"}), 200


@app.route("/api/create-stripe-customer", methods=["POST"])
def create_stripe_customer():
    """
    Creates a new customer in the Stripe database using the provided data.
    Then adds the customer ID to the user in the local database.

    Returns:
        json_object: message to the user saying success
        status_code: HTTP status code (200 for success,
                                       400 for validation errors)
    """
    try:
        # Checks if the user is logged in
        if current_user.is_authenticated:

            # gets user's name, and email

            user_id = current_user.User_id
            user_details = User.query.filter_by(User_id=user_id).first()

            f_name = user_details.First_name
            s_name = user_details.Surname
            user_email = user_details.Email

            # Creates a new customer in the Stripe database

            new_customer = stripe.Customer.create(
                name=f_name + " " + s_name,
                email=user_email,
            )
            # Adds the customer ID to the user in the local database

            user = User.query.get(user_id)
            user.Customer_ID = new_customer.id

            db.session.commit()

            return jsonify({"message": "Stripe customer created!"}), 200

        return (
            jsonify({"message": "No user logged in, unable to create stripe customer"}),
            401,
        )
    except Exception as e:
        print(f"Error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": "Failed to create Stripe customer"}), 500


@app.route("/api/create-setup-intent", methods=["POST"])
def create_setup_intent():
    """
    Creates a new setup intent in the Stripe database using the provided data.
    Then adds the setup intent ID to the user in the local database.

    Returns:
        json_object: message to the user saying success
        status_code: HTTP status code (200 for success,
                                       400 for validation errors)
    """
    try:
        # Checks if the user is logged in
        if current_user.is_authenticated:
            data = request.json
            payment_method_id = data.get("payment_method_id")
            user_id = current_user.User_id
            user_details = User.query.filter_by(User_id=user_id).first()
            customer_id = user_details.Customer_ID

            # Creates a new setup intent in the Stripe database
            setup_intent = stripe.SetupIntent.create(
                confirm=True,
                customer=customer_id,
                # currency = 'gbp',
                payment_method=payment_method_id,
                # payment_method_types = ['card'],
                # receipt_email = user_details.Email,
                usage="off_session",
                automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
            )
            # setup_future_usage, receipt_email, currency

            # Adds the setup intent ID to the user in the local database
            user = User.query.get(user_id)
            user.Setup_intent_ID = setup_intent.id
            user.Payment_method_ID = payment_method_id

            db.session.commit()

            return (
                jsonify(id=setup_intent.id, client_secret=setup_intent.client_secret),
                200,
            )

        return (
            jsonify(
                {"message": "No user logged in, unable to create stripe setup intent"}
            ),
            401,
        )
    except Exception as e:
        logger.error(f"Error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"error": e}), 400


def update_item_bid(item_id, bid_amount, user_id):
    """
    Updates the current bid of an item in the database.

    Args:
    - item_id (int): The ID of the item to update.
    - bid_amount (float): The new bid amount.
    - user_id (int): The ID of the user placing the bid.
    """
    try:
        print("Updating item bid...\n")
        logger.error("Updating item bid...\n")
        # Updates the item's current bid
        item = Items.query.filter_by(Item_id=item_id).first()
        item.Current_bid = bid_amount
        db.session.commit()

        # makes previous bid (if exists) unsuccessful
        prev_bid = (
            Bidding_history.query.filter_by(Item_id=item_id, Successful_bid=True)
            .order_by(Bidding_history.Bid_datetime.desc())
            .first()
        )
        if prev_bid is not None:
            prev_bid.Successful_bid = False
            db.session.commit()

        # Adds the new bid to the bidding history
        new_bid = Bidding_history(
            Item_id=item_id,
            Bidder_id=user_id,
            Successful_bid=True,
            Bid_datetime=datetime.datetime.now(datetime.timezone.utc),
            Winning_bid=False,
            Bid_price=bid_amount,
        )

        # Adds the user to the database and commits the changes
        db.session.add(new_bid)
        db.session.commit()
        print("Updated item bid successfully!\n")
    except Exception as e:
        logger.error(f"Error: {e}")
        logger.error(traceback.format_exc())
        print(f"Error: {e}")


@app.route("/api/place-bid", methods=["POST"])
def place_bid():
    """
    Places a bid on an auction item.
    Args: Item_id: item_id, Bid_amount: bidAmount, User_id: user.User_id
    """
    print("Placing bid...\n")
    data = request.json
    item_id = data.get("Item_id")
    bid_amount = data.get("Bid_amount")
    user_id = data.get("User_id")
    try:
        if (
            current_user.Setup_intent_ID == None
            or current_user.Payment_method_ID == None
        ):
            return (
                jsonify({"message": "Please add a payment method to place a bid"}),
                402,
            )  # 402 Payment Required
        item = Items.query.filter_by(Item_id=item_id).first()
        if not item:
            return jsonify({"message": "Item not found"}), 404

        # Validate bid (check if the bid is higher than the current minimum price)

        if float(bid_amount) < float(item.Min_price):
            return (
                jsonify({"message": "Bid must be higher than the minimum price"}),
                400,
            )
        if float(bid_amount) <= float(item.Current_bid):
            return jsonify({"message": "Bid must be higher than the current bid"}), 400

        # Place the bid and update the item price
        update_item_bid(item_id, bid_amount, user_id)

        return jsonify({"message": "Bid placed successfully"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Failed to place bid"}), 400


@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/get_current_user", methods=["GET"])
def get_current_user():
    if current_user.is_authenticated:
        return (
            jsonify(
                {
                    "user_id": current_user.User_id,
                    "first_name": current_user.First_name,
                    "level_of_access": current_user.Level_of_access,
                    "is_expert": current_user.Is_expert,
                    "Setup_intent_ID": current_user.Setup_intent_ID,
                }
            ),
            200,
        )

    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get_all_users", methods=["POST"])
def get_all_users():
    print("Wuery reached")

    users = User.query.all()
    print("USERS:", users)
    user_details_list = []

    if not users:
        return jsonify({"message": "No users found"}), 404

    for user in users:

        user_details_dict = {
            "User_id": user.User_id,
            "First_name": user.First_name,
            "Middle_name": user.Middle_name,
            "Surname": user.Surname,
            "DOB": user.DOB.strftime("%Y-%m-%d"),
            "Email": user.Email,
            "Username": user.Username,
            "Level_of_access": user.Level_of_access,
            "is_expert": user.Is_expert,
        }
        user_details_list.append(user_details_dict)
    print(user_details_list)

    return jsonify(user_details_list), 200


@app.route("/api/get-user-details", methods=["POST"])
def get_user_details():
    """
    Retrieves the user's details from the database, including expertise types
    if they are an expert (Level_of_access == 2).

    Returns:
        json_object: dictionary containing the user's details (and expertise types if applicable)
        status_code: HTTP status code (200 for success, 401 for unauthorized access)
    """

    if current_user.is_authenticated:
        user_id = current_user.User_id
        user_details = User.query.filter_by(User_id=user_id).first()

        if not user_details:
            return jsonify({"message": "User not found"}), 404

        user_details_dict = {
            "First_name": user_details.First_name,
            "Middle_name": user_details.Middle_name,
            "Surname": user_details.Surname,
            "DOB": user_details.DOB.strftime("%Y-%m-%d"),
            "Email": user_details.Email,
            "Username": user_details.Username,
            "Level_of_access": user_details.Level_of_access,
            "is_expert": user_details.Is_expert,
            "Customer_ID": user_details.Customer_ID,
            "Setup_intent_ID": user_details.Setup_intent_ID,
            "Payment_method_ID": user_details.Payment_method_ID,
        }

        # If the user is an expert, retrieve their expertise types
        if user_details.Level_of_access == 2:
            expertise_types = (
                db.session.query(Types.Type_name)
                .join(Middle_expertise, Types.Type_id == Middle_expertise.Type_id)
                .filter(Middle_expertise.Expert_id == user_id)
                .all()
            )
            user_details_dict["expertise_types"] = [
                type_name[0] for type_name in expertise_types
            ]

        return jsonify(user_details_dict), 200

    else:
        return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get-address-details", methods=["POST"])
def get_address_details():
    """
    Retrieves the user's addresses from the database, if they
    are currently logged in.

    Returns:
        json_object: dictionary containing the user's addresses
        status_code: HTTP status code (200 for success,
                                       401 for unauthorized access,
                                       400 for no address information)
    """

    # Checks if user is logged in
    if current_user.is_authenticated:
        user_id = current_user.User_id
        addresses = Address.query.filter_by(User_id=user_id).all()

        if addresses:
            addresses_list = []

            # Gets all the addresses related to the user
            for address in addresses:
                addresses_list.append(
                    {
                        "Address_id": address.Address_id,
                        "Line_1": address.Line_1,
                        "Line_2": address.Line_2,
                        "City": address.City,
                        "Country": address.Country,
                        "Postcode": address.Postcode,
                        "Region": address.Region,
                        "Is_billing": address.Is_billing,
                    }
                )

            return jsonify({"addresses": addresses_list}), 200

        return jsonify({"message": "No addresses found"}), 400

    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get-experts-authentication-requests", methods=["POST"])
def get_experts_authentication_requests():
    """
    Retrieves all pending authentication requests assigned to a specific expert.
    Only experts can access this endpoint.

    Returns:
        json_object: list of pending authentication requests
        status_code: HTTP status code (200 for success,
                                       400 for unauthorized access)
    """

    # Checks if an expert user is logged in
    if current_user.is_authenticated:
        if current_user.Is_expert == True:
            user_id = current_user.User_id

            # Seperates Listings into pending and past authentication requests
            pending_auth_requests_list = []
            past_auth_requests_list = []

            # Retrieves all authentication requests related to the expert
            auth_requests = Items.query.filter_by(Expert_id=user_id).all()

            for req in auth_requests:
                seller = User.query.filter_by(User_id=req.Seller_id).first()
                temp = {
                    "Item_id": req.Item_id,
                    "Listing_name": req.Listing_name,
                    "Seller_id": seller.User_id,
                    "Seller_name": seller.First_name + " " + seller.Surname,
                    "Upload_datetime": req.Upload_datetime.strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                    "Min_price": req.Min_price,
                    "Description": req.Description,
                    "Verified": req.Verified,
                }

                # Adds the request to the appropriate list based on whether it's a pending or past request
                if req.Authentication_request:
                    pending_auth_requests_list.append(temp)
                else:
                    past_auth_requests_list.append(temp)

            return (
                jsonify(
                    {
                        "pending_auth_requests": pending_auth_requests_list,
                        "past_auth_requests": past_auth_requests_list,
                    }
                ),
                200,
            )

        return jsonify({"message": "User has invalid access level"}), 401

    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/update-user-details", methods=["POST"])
def update_user_details():
    """
    Updates the user's details in the database, if they
    are currently logged in. Validates user input through form.

    Returns:
        json_object: message to the user saying success
        status_code: HTTP status code (200 for success,
                                       400 for validation errors,
                                       401 for unauthorized access)
    """

    # Checks if the user is logged in
    if current_user.is_authenticated:
        data = request.json
        form = update_user_form(data=data)
        errors = {}

        if not form.validate():
            for field, messages in form.errors.items():
                errors[field] = messages

        if errors:
            return jsonify({"errors": errors}), 400

        # Converts DOB to date object
        DOB = datetime.datetime.strptime(data["DOB"], "%Y-%m-%d").date()

        # Updates user's details in the database
        user_id = current_user.User_id
        user = User.query.get(user_id)
        user.First_name = data["First_name"].capitalize()
        user.Middle_name = data["Middle_name"].capitalize()
        user.Surname = data["Surname"].capitalize()
        user.DOB = DOB

        db.session.commit()

        return jsonify({"message": "Details Updated Successfully"}), 200

    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/update_level", methods=["POST"])
def update_level():
    
    data = request.json
    user_ids = data.get("user_id", "")
    new_levels = data.get("level_of_access", "")
    if not user_ids or not new_levels:
        return jsonify({"error": "Missing user_id or level_of_access in request"}), 400

    if len(user_ids) != len(new_levels):
        return (
            jsonify({"error": "Mismatch between user_id and level_of_access lengths"}),
            400,
        )

    valid_levels = {"1", "2", "3"}  # Using string values here for validation

    for level in new_levels:
        if level not in valid_levels:
            return jsonify({"error": f"Invalid level_of_access value: {level}"}), 500

    try:
        for i in range(len(user_ids)):
            user = User.query.filter_by(User_id=user_ids[i]).first()
            # print(f"will update user_id {user_ids[i]} to level : {new_levels[i]}")
            if not user:
                return jsonify({"error": "User no found"}), 404

            # update level of access
            user.Level_of_access = new_levels[i] 
            
            # update is_expert according to access level
            if new_levels[i] == "2":
                # print("changed to expert")
                user.Is_expert = 1
            else:
                user.Is_expert = 0

            db.session.commit()

        return jsonify({"message": "Levels updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/get_bid_filtering", methods=["POST"])
def get_bid_filtering():

    data = request.json
    bid_status_selected = data.get("bid_status", "")

    listing_Ids = data.get("listing_Ids", [])
    listing_Ids = list(map(int, listing_Ids))
    filtered_listing_Ids = []
    # print(bid_status_selected)
    user_id = current_user.User_id

    for Id in listing_Ids:
        bid_table = (
            db.session.query(
                Items.Item_id,
                Items.Available_until,
                Bidding_history.Successful_bid,
                Bidding_history.Winning_bid,
            )
            .join(Bidding_history, Items.Item_id == Bidding_history.Item_id)
            .filter(Bidding_history.Bidder_id == user_id, Items.Item_id == Id)
            .all()
        )


        # print("BID", bid_table)
        for item_id, available_until, successful_bid, winning_bid in bid_table:
            # Condition to check if the bid has expired
            if available_until.replace(
                tzinfo=datetime.timezone.utc
            ) < datetime.datetime.now(
                datetime.timezone.utc
            ):  # Check if the bid has expired, won is only possible after expired
                if bid_status_selected:  # Ensure bid_status_selected is not None
                    if bid_status_selected == "won":
                        if successful_bid == True and winning_bid == True:
                            filtered_listing_Ids.append(Id)

                    elif bid_status_selected == "payment_failed":
                        if successful_bid == True and winning_bid != True:
                            filtered_listing_Ids.append(Id)

                    elif bid_status_selected == "expired":
                        filtered_listing_Ids.append(Id)

                    if bid_status_selected == "out_bid":
                        if successful_bid == False:
                            filtered_listing_Ids.append(Id)
            else:
                # out bid possible even when item is not expired
                if bid_status_selected == "out_bid":
                    print("in out_bid, checking succesful_bid", successful_bid)
                    if successful_bid == False:
                        filtered_listing_Ids.append(Id)

    return jsonify(filtered_listing_Ids)


@app.route("/api/get_category_filters", methods=["POST"])
def get_category_filters():
    data = request.json
    categories_str = data.get("categories", "")
    categories_list = categories_str.split(",") if categories_str else []

    # Query all available items efficiently
    available_items = (
        db.session.query(Items)
        .join(User, Items.Seller_id == User.User_id)
        .filter(

            Items.Available_until > datetime.datetime.now(datetime.timezone.utc),
            db.or_(
                db.and_(
                    Items.Authentication_request == False,
                    Items.Verified == True,
                    Items.Authentication_request_approved == True,
                ),
                db.and_(
                    Items.Authentication_request == False,
                    Items.Verified == False,
                    Items.Authentication_request_approved == None,
                ),
            ),
        )
        .options(joinedload(Items.seller))  # Preload seller data
        .all()
    )

    # If no categories are selected, return all available items
    if not categories_list:
        return _generate_response(available_items)

    # Query item types and filter by category using SQL
    filtered_ids = set()
    for category in categories_list:
        matching_items = (
            db.session.query(Items.Item_id)
            .join(Middle_type, Middle_type.Item_id == Items.Item_id)
            .join(Types, Types.Type_id == Middle_type.Type_id)
            .filter(Types.Type_name.ilike(f"%{category}%"))  # SQL filtering
            .all()
        )
        filtered_ids.update(item_id for item_id, in matching_items)

    # If no matching items found for given categories, return empty response
    if not filtered_ids:
        return _generate_response([])

    # Get items that match the filtered IDs and are available
    filtered_items = [item for item in available_items if item.Item_id in filtered_ids]

    return _generate_response(filtered_items)


def _generate_response(items):
    """Helper function to format and return JSON response."""
    item_ids = [item.Item_id for item in items]

    # Fetch images in a single query
    images = {
        img.Item_id: base64.b64encode(img.Image).decode("utf-8")
        for img in Images.query.filter(Images.Item_id.in_(item_ids)).all()
    }

    items_list = [
        {
            "Item_id": item.Item_id,
            "Seller_username": item.seller.First_name if item.seller else None,
            "Listing_name": item.Listing_name,
            "Seller_id": item.Seller_id,
            "Available_until": item.Available_until,
            "Verified": item.Verified,
            "Min_price": item.Min_price,
            "Current_bid": item.Current_bid,
            "Image": images.get(item.Item_id),
        }
        for item in items
    ]

    response = jsonify(items_list)
    response.headers["Cache-Control"] = "public, max-age=86400"  # Cache for 24 hours
    return response, 200

@app.route("/api/get_search_filter", methods=["POST"])
def get_search_filter():
    """
    This endpoint handles filtering of items based on the search query provided by the user.
    It can filter either by user or item based on the input flags (`user` or `item`) and search query.

    Request Body (JSON):
    - user (bool): Indicates whether to filter by users (not implemented in this version).
    - item (bool): Indicates whether to filter by items (required for this version).
    - searchQuery (str): The search term used to filter item names and item tags.

    Response Body:
    - A list of dictionaries containing filtered item details, including the item ID, listing name,
      seller ID, availability, verification status, minimum price, current bid, and item image (if available).

    Returns:
        JSON: A list of filtered item details (based on the search query).
    """

    data = request.json
    user = data.get("user", "")
    item = data.get("item", "")
    searchQuery = (data.get("searchQuery", "")).strip().lower()
    # print("SEARCH QUERY IN BACKEND", searchQuery)
    filtered_ids = []
    search_tokens = []
    filtered_items = []
    filtered_users = []

    if item:
        available_items = (
            db.session.query(Items)
            .join(User, Items.Seller_id == User.User_id)
            .filter(

                Items.Available_until > datetime.datetime.now(datetime.timezone.utc),
                db.or_(
                    db.and_(
                        Items.Authentication_request == False,
                        Items.Verified == True,
                        Items.Authentication_request_approved == True,
                    ),
                    db.and_(
                        Items.Authentication_request == False,
                        Items.Verified == False,
                        Items.Authentication_request_approved == None,
                    ),
                ),
            )
            .all()
        )
        if searchQuery == "":
            # Return all items
            filtered_items = available_items
        else:
            # filter by item name, works with space seperated strings
            item_names_and_Ids = [
                (item.Listing_name, item.Item_id) for item in available_items
            ]
            
            for name, item_id in item_names_and_Ids:
                name = name.lower()
                name_tokens = name.split()
                search_tokens = searchQuery.split()

                for i in range(len(name_tokens) - len(search_tokens) + 1):
                    if all(
                        name_tokens[i + j].startswith(search_tokens[j])
                        for j in range(len(search_tokens))
                    ):
                        filtered_ids.append(item_id)

             # filter by item_tags, works for tags that have more than one token
            type_names = (
            db.session.query(Types.Type_name, Items.Item_id)
            .join(Middle_type, Middle_type.Item_id == Items.Item_id)
            .join(Types, Types.Type_id == Middle_type.Type_id)
            .filter(
                Items.Available_until > datetime.datetime.now(datetime.timezone.utc),
                db.or_(
                    db.and_(
                        Items.Authentication_request == False,
                        Items.Verified == True,
                        Items.Authentication_request_approved == True,
                    ),
                    db.and_(
                        Items.Authentication_request == False,
                        Items.Verified == False,
                        Items.Authentication_request_approved == None,
                    ),
                ),
            )
            .all()
            )

            item_ids_unique = list(set(item_id for _, item_id in type_names)) 
            # print(item_ids_unique)
            for tag_name, item_id in type_names:
                tag_name = tag_name.lower()
                tag_name_tokens = tag_name.split()
                for i in range(len(tag_name_tokens) - len(search_tokens) + 1):
                    # print("Search tags",search_tokens)
                    if all(
                        tag_name_tokens[i + j].startswith(search_tokens[j])
                        for j in range(len(search_tokens))
                    ):
                        # ensure no duplicates of item_ids
                        if item_id not in filtered_ids:
                            filtered_ids.append(item_id)
                            
                
            # search for multiple tags seperated by " ", tag 1 AND tag 2 AND ...
            for item_id in item_ids_unique :
                multiple_tags_count = 0
                item_types = {type_name.lower() for type_name, id in type_names if id == item_id}

                for token in search_tokens:
                    for type_name in item_types:
                        # print(f"comparing search token {token} with type {type_name}")
                        if type_name.startswith(token):
                            multiple_tags_count += 1
                
                # print(multiple_tags_count)
                if multiple_tags_count >= len(search_tokens):
                    if item_id not in filtered_ids:
                            filtered_ids.append(item_id)

            # get items from filtered Ids
            # print(type_names)
            filtered_items = (
                db.session.query(Items).filter(Items.Item_id.in_(filtered_ids)).all()
            )

        # Turn into dict
        items_list = []
        for item in filtered_items:
            image = Images.query.filter(Images.Item_id == item.Item_id).first()
            tags = (
                db.session.query(Types.Type_name)
                .join(Middle_type, Types.Type_id == Middle_type.Type_id)
                .filter(Middle_type.Item_id == item.Item_id)
                .all()
            )

            tag_list = [tag.Type_name for tag in tags]

            item_details_dict = {
                "Item_id": item.Item_id,
                "Listing_name": item.Listing_name,
                "Seller_name": User.query.filter_by(User_id=item.Seller_id)
                .first()
                .First_name,
                "Seller_id": item.Seller_id,
                "Available_until": item.Available_until,
                "Verified": item.Verified,
                "Min_price": item.Min_price,
                "Current_bid": item.Current_bid,
                "Image": (
                    base64.b64encode(image.Image).decode("utf-8") if image else None
                ),
                "Tags": tag_list,
            }

            items_list.append(item_details_dict)

        return jsonify(items_list), 200
        # Ensure Items model has a to_dict() method
        
    # filter for users
    elif user:
        # returns all if no search query
        if not searchQuery or searchQuery == " ":
            filtered_users = db.session.query(User).all()
            print(filtered_users)

        else:
            # print("Searching users")
            filtered_user_ids = []

            # filtering by first, middle, last name
            user_names_and_Ids = db.session.query(
                User.First_name, User.Middle_name, User.Surname, User.User_id
            ).all()

            for first, middle, last, user_id in user_names_and_Ids:
                if middle == "" or middle == None:
                    name_tokens = [first.lower(), middle, last.lower()]
                else:
                    name_tokens = [first.lower(), middle.lower(), last.lower()]

                search_tokens = searchQuery.lower().split()

                # if searchQuery has two tokens or more, it matches both in the same sequence to the name token
                if len(search_tokens) > 1:
                    # print("SEARCH", search_tokens)
                    matched = False
                    if len(search_tokens) <= len(name_tokens):
                        # if name_tokens >= two, it matches first search_token to first name,
                        # second to middle name, third to last
                        
                        # if name_tokens has a middle name
                        if name_tokens[1] != "" and name_tokens[1] != None:
                            for i in range(len(search_tokens)):
                                if (
                                    not name_tokens[i]
                                    .lower()
                                    .startswith(search_tokens[i])
                                ):
                                    matched = False
                                    print("NOT MATCHED : comparing name_toke", name_tokens[i], " with search query token ", search_tokens[i])
                                    break
                                else:
                                    print("MATCHED : comparing name_toke", name_tokens[i], " with search query token ", search_tokens[i])
                                    matched = True
                            # if name has middle name but search query has first + last
                            # this matches first name to seach quary token 1 and last name to search query token 2
                            if len(search_tokens) == 2 and name_tokens[0] == search_tokens[0] and name_tokens[2].startswith(search_tokens[1]):
                                matched = True
                                

                        else:
                            # if name has no middle name, then second search token should match with last name or middle name
                            if name_tokens[0] == search_tokens[0]:
                                if name_tokens[2].startswith(search_tokens[1]):
                                    matched = True
                                else:
                                    matched = False
                            else:
                                matched = False

                    if matched:
                        filtered_user_ids.append(user_id)

                # deals with single search query : basic keyword matching
                elif len(search_tokens) == 1:
                    for i in range(len(name_tokens)):
                        if name_tokens[i] != None:
                            if name_tokens[i].lower().startswith(search_tokens[0]):
                                filtered_user_ids.append(user_id)

            filtered_users = (
                db.session.query(User).filter(User.User_id.in_(filtered_user_ids)).all()
            )
            # print(filtered_users)

        users_list = []
        for user in filtered_users:
            middle_name = user.Middle_name
            if user.Middle_name == None:
                middle_name = ""
            user_details_dict = {
                "User_id": user.User_id,
                "Username": user.Username,
                "Password": user.Password,
                "Email": user.Email,
                "First_name": user.First_name,
                "Middle_name": middle_name,
                "Surname": user.Surname,
                "DOB": user.DOB,
                "Level_of_access": user.Level_of_access,
                "Is_expert": user.Is_expert,
            }

            users_list.append(user_details_dict)

        return jsonify(users_list), 200



@app.route("/api/get_filtered_listings", methods=["POST"])
def get_filtered_listings():
    """Filters listings based on the selected price range. (will be implementing more categories)

    Receives a JSON payload containing:
    - price_range (str): Selected price filter category.
    - listing_Ids (list): List of listing IDs to filter.

    Returns:
    - JSON response with a list of filtered listing IDs that match the price range.
    - Returns an error response if an exception occurs.
    """
    # Intakes all filter data
    # filter_price, filter_searchQuery, filter_bid_status
    # These are NULL if filter is not applied or have the filter type parsed through

    try:
        data = request.json
        min_price = data.get("min_price", "")
        max_price = data.get("max_price", "")
        listing_Ids = data.get("listing_Ids", [])
        listing_Ids = list(map(int, listing_Ids))
        filtered_listing_Ids = []
        if min_price != "" and max_price != "":
            for Id in listing_Ids:
                item = Items.query.filter_by(Item_id=Id).first()
                print(item.Listing_name)

                if (
                    get_listing_price(item) <= max_price
                    and get_listing_price(item) >= min_price
                ):
                    filtered_listing_Ids.append(Id)

        return jsonify(filtered_listing_Ids)

    except Exception as e:
        print(f"Error : {e}")
        return jsonify({"error": "Interal Server Error"}), 500


def get_listing_price(listing):
    """
    Determines the correct price of a listing.

    If the current bid is lower than the minimum price, the function returns the minimum price.
    Otherwise, it returns the current bid.

    Args:
    - listing (object): An item object containing 'Current_bid' and 'Min_price' attributes.

    Returns:
    - int: The listing's current price.
    """
    if listing.Current_bid < listing.Min_price:
        return listing.Min_price
    else:
        return listing.Current_bid


@app.route("/api/update-address", methods=["POST"])
def update_address():
    """
    Updates the user's address in the database, if they are currently logged in.
    Validates user input through form.

    Returns:
        json_object: message to the user saying success
        status_code: HTTP status code (200 for success,
                     400 for validation errors,
                     401 for unauthorized access)
    """
    # Checks if user is logged in
    if current_user.is_authenticated:
        data = request.json
        """ gets form_data from frontend"""
        user_id = current_user.User_id

        # Updates the parameter to be Boolean value
        if data["Is_billing"] == "":
            data["Is_billing"] = False
        else:
            data["Is_billing"] = True

        # If the User is creating a new address...
        if data["Address_id"] == "":
            new_address = Address(
                User_id=user_id,
                Line_1=data["Line_1"],
                Line_2=data["Line_2"],
                City=data["City"],
                Country=data["Country"],
                Postcode=data["Postcode"],
                Region=data["Region"],
                Is_billing=data["Is_billing"],
            )

            if data["Is_billing"]:
                addresses = Address.query.filter_by(User_id=user_id).all()

                if addresses is not None:
                    Address.query.filter_by(User_id=user_id).update(
                        {"Is_billing": False}
                    )
                    db.session.flush()

            db.session.add(new_address)
            db.session.commit()

            return jsonify({"message": "Address updated successfully"}), 200

        # If the User is updating an existing address...
        # Gets updated address
        address = Address.query.filter_by(
            User_id=user_id, Address_id=data["Address_id"]
        ).first()

        # Updates information
        address.Line_1 = data["Line_1"]
        address.Line_2 = data["Line_2"]
        address.City = data["City"]
        address.Country = data["Country"]
        address.Postcode = data["Postcode"]
        address.Region = data["Region"]
        address.Is_billing = data["Is_billing"]

        # flush() is like a soft commit - allows us to make changes to the database without
        # having to commit the changes to the database right away.
        db.session.flush()

        # Only one address is allowed to be the billing address
        if data["Is_billing"]:
            # Makes all the addresses Is_billing = False
            Address.query.filter_by(User_id=user_id).update({"Is_billing": False})
            db.session.flush()

            # Makes only the updated addresses the billing address
            address = Address.query.filter_by(Address_id=data["Address_id"]).first()
            address.Is_billing = True

        db.session.commit()

        return jsonify({"message": "Address updated successfully"}), 200

    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/update_auth_request", methods=["POST"])
def update_auth_request():
    """
    Updates the status of an authentication request in the database.
    If the user is an expert, they can accept or reject the request.

    Returns:
        json_object: message about success or failure
        status_code: HTTP status code (200 for success,
                                       401 for unauthorized access)
    """

    # Checks if an expert user is logged in
    if current_user.is_authenticated:
        if current_user.Is_expert == True:
            data = request.json
            user_id = current_user.User_id

            # Retrieves the request to be updated
            request_to_update = Items.query.filter_by(
                Item_id=data["request_id"]
            ).first()

            # Updates information according to if the request was accepted or declined
            if data["action"] == "accept":
                request_to_update.Available_until += datetime.datetime.now(
                    datetime.timezone.utc
                ) - request_to_update.Upload_datetime.replace(
                    tzinfo=datetime.timezone.utc
                )
                request_to_update.Verified = True
                request_to_update.Authentication_request = False
                request_to_update.Authentication_request_approved = True
            else:
                request_to_update.Verified = False
                request_to_update.Authentication_request = False
                request_to_update.Authentication_request_approved = False

            db.session.commit()

            return jsonify({"message": "Successfully updated information"}), 200

        return jsonify({"message": "User has invalid access level"}), 401

    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/delete-address", methods=["POST"])
def delete_address():
    """
    Deletes the user's address from the database, if they are currently logged in.

    Returns:
        json_object: message about success or failure
        status_code: HTTP status code (200 for success,
                                       401 for unauthorized access)
    """

    if current_user.is_authenticated:
        data = request.json
        user_id = current_user.User_id
        Address.query.filter_by(Address_id=data["Address_id"], User_id=user_id).delete()

        db.session.commit()

        return jsonify({"message": "Address deleted successfully"}), 200

    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/create-listing", methods=["POST"])
def Create_listing():
    form = Create_listing_form()

    # Validates form and collects any errors
    if not form.validate_on_submit():
        return jsonify({"errors": form.errors}), 400

    try:

        if request.form["authentication_request"] == "false":
            authentication_request = False
        else:
            authentication_request = True

        time_now = datetime.datetime.now(datetime.timezone.utc)
        # time_after_days_available = datetime.datetime.now(
        #     datetime.timezone.utc
        # ) + datetime.timedelta(days=int(request.form["days_available"]))
        time_after_days_available = datetime.datetime.now(
            datetime.timezone.utc
        ) + datetime.timedelta(days=int(request.form["days_available"]))

        struct_id = None

        prof_struct = Profit_structure.query.order_by(
            Profit_structure.Enforced_datetime.desc()
        ).first()

        if prof_struct:
            struct_id = prof_struct.Structure_id

        # Creates a new listing with given data
        listing = Items(
            Listing_name=request.form["listing_name"],
            Seller_id=int(request.form["seller_id"]),
            Verified=False,
            Upload_datetime=time_now,
            Available_until=time_after_days_available,
            Min_price=float(request.form["minimum_price"]),
            Current_bid=0,
            Description=request.form["listing_description"],
            Authentication_request=authentication_request,
            Structure_id=struct_id,
        )
        print(
            "Authentication Request:", request.form.get("authentication_request", False)
        )

        # Adds the item to the database and then flushes so that we can get listing.Item_id **IMPORTANT**
        db.session.add(listing)
        db.session.flush()

        # Goes through the images passed through and saves the necessary information to the saved_images list as Images objects.
        saved_images = []
        if "images" in request.files:
            images = request.files.getlist("images")
            for image in images:
                image_record = Images(
                    Item_id=listing.Item_id,
                    Image=image.read(),
                    Image_description="This is an image",
                )
                saved_images.append(image_record)

        # Bulk saves all the images in saved_images
        if saved_images:
            db.session.bulk_save_objects(saved_images)

        # Adds the tags in.
        tags = json.loads(request.form.get("tags", "[]"))
        for tag in tags:
            middle_type_record = Middle_type(Item_id=listing.Item_id, Type_id=tag)
            db.session.add(middle_type_record)

        # Commits to complete the transaction
        db.session.commit()
        print("here")
        item = Items.query.filter_by(
            Seller_id=int(request.form["seller_id"]), Upload_datetime=time_now
        ).first()

        try:
            schedule_auction(item)  # Use the already-created `listing` object
        except Exception as e:
            logger.error(f"Failed to schedule auction: {e}")

        # Returns a success message and a status code of 200 (ok)
        return jsonify({"message": "Listing created successfully"}), 200

    except Exception as e:
        # If there are any errors, then we need to rollback to ensure the integrity of our database.
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({"error": "Failed to create listing in the backend"}), 500


@app.route("/api/get-items", methods=["POST"])
def get_listings():
    """
    Retrieves the item details from the database that are still available.

    Returns:
        json_object:  containing the items details
        status_code: HTTP status code (200 for success,
                                       401 for unauthorized access)
    """

    try:
        # Checks if the listing is available and doesn't still need authentication.
        available_items = (
            db.session.query(Items, User.Username)
            .join(User, Items.Seller_id == User.User_id)
            .filter(

                Items.Available_until > datetime.datetime.now(datetime.timezone.utc),
                db.or_(
                    db.and_(
                        Items.Authentication_request == False,
                        Items.Verified == True,
                        Items.Authentication_request_approved == True,
                    ),
                    db.and_(
                        Items.Authentication_request == False,
                        Items.Verified == False,
                        Items.Authentication_request_approved == None,
                    ),
                ),
            )
            .all()
        )

        items_list = []
        for item, username in available_items:

            image = Images.query.filter(Images.Item_id == item.Item_id).first()

            tags = (
                db.session.query(Types.Type_name)
                .join(Middle_type, Types.Type_id == Middle_type.Type_id)
                .filter(Middle_type.Item_id == item.Item_id)
                .all()
            )

            tag_list = [tag.Type_name for tag in tags]

            item_details_dict = {
                "Item_id": item.Item_id,
                "Listing_name": item.Listing_name,
                "Seller_id": item.Seller_id,
                "Seller_username": username,
                "Available_until": item.Available_until,
                "Verified": item.Verified,
                "Min_price": item.Min_price,
                "Current_bid": item.Current_bid,
                "Image": base64.b64encode(image.Image).decode("utf-8"),
                "Tags": tag_list,
            }
            items_list.append(item_details_dict)

        return jsonify(items_list), 200

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to retrieve items"}), 401


@app.route("/api/get-seller-items", methods=["POST"])
def get_seller_listings():
    """
    Retrieves the item details that were sold by user from the database that are still available.

    Returns:
        json_object:  containing the items details
        status_code: HTTP status code (200 for success,
                                       401 for unauthorized access)
    """

    try:
        # Checks if the listing is available and doesn't still need authentication.
        available_items = (
            db.session.query(Items, User.Username)
            .join(User, Items.Seller_id == User.User_id)
            .filter(
                Items.Seller_id == current_user.User_id,

                Items.Available_until > datetime.datetime.now(datetime.timezone.utc),
                db.or_(
                    db.and_(
                        Items.Authentication_request == False,
                        Items.Verified == True,
                        Items.Authentication_request_approved == True,
                    ),
                    db.and_(
                        Items.Authentication_request == False,
                        Items.Verified == False,
                        Items.Authentication_request_approved == None,
                    ),
                ),
            )
            .all()
        )

        items_list = []
        for item, username in available_items:

            image = Images.query.filter(Images.Item_id == item.Item_id).first()

            item_details_dict = {
                "Item_id": item.Item_id,
                "Listing_name": item.Listing_name,
                "Seller_id": item.Seller_id,
                "Seller_username": username,
                "Available_until": item.Available_until,
                "Verified": item.Verified,
                "Min_price": item.Min_price,
                "Current_bid": item.Current_bid,
                "Image": base64.b64encode(image.Image).decode("utf-8"),
                "Expert_id": item.Expert_id,
                "Authentication_request_approved": item.Authentication_request_approved,
                "Authentication_request": item.Authentication_request,
            }
            items_list.append(item_details_dict)
        return jsonify(items_list), 200

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to retrieve items"}), 401


@app.route("/api/get-sellerss-items", methods=["POST"])
def get_sellerss_listings():
    """
    Retrieves the item details that were sold by user from the database that are still available.
    ALI's FUNCTION NOT ADAM
    Returns:
        json_object:  containing the items details
        status_code: HTTP status code (200 for success,
                                       401 for unauthorized access)
    """
    try:
        # Get all items for the current seller
        items_query = (
            db.session.query(Items, User.Username)
            .join(User, Items.Seller_id == User.User_id)
            .filter(Items.Seller_id == current_user.User_id)
            .order_by(Items.Available_until.desc())
            .all()
        )

        items_list = []
        for item, username in items_query:
            image = Images.query.filter(Images.Item_id == item.Item_id).first()

            tags = (
                db.session.query(Types.Type_name)
                .join(Middle_type, Types.Type_id == Middle_type.Type_id)
                .filter(Middle_type.Item_id == item.Item_id)
                .all()
            )

            tag_list = [tag.Type_name for tag in tags]

            item_details_dict = {
                "Item_id": item.Item_id,
                "Listing_name": item.Listing_name,
                "Seller_id": item.Seller_id,
                "Seller_username": username,
                "Available_until": item.Available_until,
                "Verified": item.Verified,
                "Min_price": item.Min_price,
                "Current_bid": item.Current_bid,
                "Image": base64.b64encode(image.Image).decode("utf-8") if image else "",
                "Expert_id": item.Expert_id,
                "Authentication_request_approved": item.Authentication_request_approved,
                "Authentication_request": item.Authentication_request,
                "Tags": tag_list,
                "Sold": item.Sold,
            }
            items_list.append(item_details_dict)
        return jsonify(items_list), 200

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to retrieve items"}), 401


@app.route("/api/get-bids", methods=["GET"])
def get_bids():
    """
    Retrieves the user's current bids from the database, ensuring that only the highest bid for each item
    is returned, if they are currently logged in.

    Returns:
        json_object: dictionary containing the user's highest bid per item
        status_code: HTTP status code (200 for success,
                                       401 for unauthorized access,
                                       400 for no bidding information)
    """

    # Checks if user is logged in
    if current_user.is_authenticated:
        bid_data = (
            Bidding_history.query.join(
                Items, Bidding_history.Item_id == Items.Item_id
            )  # Join Items table
            .join(
                User, Items.Seller_id == User.User_id
            )  # Join User table to get seller info
            .filter(
                Bidding_history.Bidder_id == current_user.User_id,

                Items.Available_until
                > datetime.datetime.now(datetime.timezone.utc),  # Only valid bids
            )
            .with_entities(
                Bidding_history.Bid_id,
                Bidding_history.Bid_price,
                Bidding_history.Bid_datetime,
                Bidding_history.Successful_bid,
                Items.Item_id,
                Items.Listing_name,
                Items.Description,
                Items.Current_bid,
                Items.Available_until,
                User.Username,
                Items.Min_price,
            )
            .order_by(
                Items.Item_id, Bidding_history.Bid_price.desc()
            )  # Order by Item and Bid Price (descending)
            .all()
        )

        if not bid_data:
            return jsonify({"message": "No current bids"}), 400

        # Create a dictionary to store the highest bid per item
        unique_bids = {}

        for item in bid_data:
            if item.Item_id not in unique_bids:
                images = Images.query.filter_by(Item_id=item.Item_id).all()
                image_list = []

                for image in images:
                    image_data = image.Image
                    image_base64 = (
                        base64.b64encode(image_data).decode("utf-8")
                        if image_data
                        else None
                    )
                    image_list.append(
                        {
                            "Image": image_base64,
                            "Image_description": (
                                image.Image_description
                                if image.Image_description
                                else "No description available"
                            ),
                        }
                    )

                tags = (
                    db.session.query(Types.Type_name)
                    .join(Middle_type, Types.Type_id == Middle_type.Type_id)
                    .filter(Middle_type.Item_id == item.Item_id)
                    .all()
                )

                tag_list = [tag.Type_name for tag in tags]

                unique_bids[item.Item_id] = {
                    "Bid_id": item.Bid_id,
                    "Bid_price": item.Bid_price,
                    "Bid_datetime": item.Bid_datetime,
                    "Successful_bid": item.Successful_bid,
                    "Item_id": item.Item_id,
                    "Listing_name": item.Listing_name,
                    "Description": item.Description,
                    "Current_bid": item.Current_bid,
                    "Available_until": item.Available_until,
                    "Seller_name": item.Username,
                    "Images": image_list,
                    "Min_price": item.Min_price,
                    "Tags": tag_list,
                }

        # Convert dictionary to list for JSON response
        current_bids = list(unique_bids.values())
        response = jsonify({"bids": current_bids})
        return response, 200

    else:
        return jsonify({"message": "No user logged in"}), 401


@cache.cached(timeout=30, key_prefix=lambda: f"user_history_{current_user.User_id}")
@app.route("/api/get-history", methods=["GET"])
def get_history():
    """
    Retrieves the user's expired bids from the database, ensuring that only the highest bid for each item
    is returned, if they are currently logged in.

    Returns:
        json_object: dictionary containing the user's highest bid per item
        status_code: HTTP status code (200 for success,
                                       401 for unauthorized access,
                                       400 for no bidding information)
    """

    # Checks if user is logged in
    if current_user.is_authenticated:
        bid_data = (
            Bidding_history.query.join(
                Items, Bidding_history.Item_id == Items.Item_id
            )  # Join Items table
            .join(
                User, Items.Seller_id == User.User_id
            )  # Join User table to get seller info
            .outerjoin(
                Images, Items.Item_id == Images.Item_id
            )  # Outer join Images table to get item image
            .filter(
                Bidding_history.Bidder_id == current_user.User_id,

                Items.Available_until
                < datetime.datetime.now(datetime.timezone.utc),  # Only expired bids
            )
            .with_entities(
                Bidding_history.Bid_id,
                Bidding_history.Bid_price,
                Bidding_history.Bid_datetime,
                Bidding_history.Successful_bid,
                Bidding_history.Winning_bid,
                Items.Item_id,
                Items.Listing_name,
                Items.Description,
                Items.Current_bid,
                Items.Available_until,
                User.Username,
                Images.Image,
                Images.Image_description,
                Items.Min_price,
            )
            .order_by(
                Items.Item_id, Bidding_history.Bid_price.desc()
            )  # Order by Item and Bid Price (descending)
            .all()
        )

        if not bid_data:
            return jsonify({"message": "No expired bids"}), 400

        # Create a dictionary to store the highest bid per item
        unique_bids = {}

        for item in bid_data:
            if item.Item_id not in unique_bids:
                images = Images.query.filter_by(Item_id=item.Item_id).all()
                image_list = []

                for image in images:
                    image_data = image.Image
                    image_base64 = (
                        base64.b64encode(image_data).decode("utf-8")
                        if image_data
                        else None
                    )
                    image_list.append(
                        {
                            "Image": image_base64,
                            "Image_description": (
                                image.Image_description
                                if image.Image_description
                                else "No description available"
                            ),
                        }
                    )

                tags = (
                    db.session.query(Types.Type_name)
                    .join(Middle_type, Types.Type_id == Middle_type.Type_id)
                    .filter(Middle_type.Item_id == item.Item_id)
                    .all()
                )

                tag_list = [tag.Type_name for tag in tags]

                unique_bids[item.Item_id] = {
                    "Bid_id": item.Bid_id,
                    "Bid_price": item.Bid_price,
                    "Bid_datetime": item.Bid_datetime,
                    "Successful_bid": item.Successful_bid,
                    "Winning_bid": item.Winning_bid,
                    "Item_id": item.Item_id,
                    "Listing_name": item.Listing_name,
                    "Description": item.Description,
                    "Current_bid": item.Current_bid,
                    "Available_until": item.Available_until,
                    "Seller_name": item.Username,
                    "Images": image_list,
                    "Image_description": item.Image_description or "No Image",
                    "Min_price": item.Min_price,
                    "Tags": tag_list,
                }

        # Convert dictionary to list for JSON response
        history = list(unique_bids.values())
        response = jsonify({"history": history})
        response.headers["Cache-Control"] = (
            "public, max-age=86400"  # Cache for 24 hours
        )
        return response, 200

    else:
        return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get-pending-auth", methods=["GET"])
def get_pending_auth():
    """
    Retrieves all the items that are pending authentication.
    """
    if not current_user.is_authenticated:
        return jsonify({"message": "No user logged in"}), 401

    # Only managers (level 3) can access this endpoint.
    if current_user.Level_of_access == 3:
        try:
            # Fetch all pending authentication items in one query
            unassigned_items = (
                Items.query.join(
                    User, Items.Seller_id == User.User_id
                )  # Join Users table to get seller info
                .filter(Items.Authentication_request == True, Items.Expert_id.is_(None))
                .with_entities(
                    Items.Item_id,
                    Items.Listing_name,
                    Items.Description,
                    Items.Current_bid,
                    Items.Available_until,
                    User.Username,
                )
                .all()
            )

            if not unassigned_items:
                return jsonify({"message": "No items require authentication"}), 200

            # Convert query results to JSON
            unassigned_data = []
            for item in unassigned_items:
                # Fetch all images for the current item
                images = Images.query.filter_by(Item_id=item.Item_id).all()
                image_list = []

                for image in images:
                    image_data = image.Image
                    image_base64 = (
                        base64.b64encode(image_data).decode("utf-8")
                        if image_data
                        else None
                    )
                    image_list.append(
                        {
                            "Image": image_base64,
                            "Image_description": (
                                image.Image_description
                                if image.Image_description
                                else "No description available"
                            ),
                        }
                    )

                tags = (
                    db.session.query(Types.Type_name)
                    .join(Middle_type, Types.Type_id == Middle_type.Type_id)
                    .filter(Middle_type.Item_id == item.Item_id)
                    .all()
                )

                tag_list = [tag.Type_name for tag in tags]

                unassigned_data.append(
                    {
                        "Item_id": item.Item_id,
                        "Listing_name": item.Listing_name,
                        "Description": item.Description,
                        "Current_bid": item.Current_bid,
                        "Available_until": item.Available_until,
                        "Username": item.Username,
                        "Images": image_list,
                        "Tags": tag_list,
                    }
                )

            return jsonify({"Authentication required": unassigned_data}), 200

        except Exception as e:
            print("Error:", e)
            return jsonify({"Error": "Failed to retrieve items"}), 500

    return jsonify({"message": "User has invalid access level"}), 401


@app.route("/api/get-expert-id", methods=["GET"])
def get_expert_id():
    """
    Retrieves all available experts (users with Level_of_access == 2) for assignment plus their tags.
    """
    if not current_user.is_authenticated:
        return jsonify({"message": "No user logged in"}), 401

    # Only managers (level 3) can access this endpoint.
    if current_user.Level_of_access == 3:
        try:
            # Fetch experts available for assignment
            experts = User.query.filter(User.Level_of_access == 2).all()

            if not experts:
                return jsonify({"message": "No available experts found"}), 200

            expert_data = []
            for expert in experts:
                # Fetch all expertise tags for the expert
                tags = (
                    db.session.query(Types.Type_name)
                    .join(Middle_expertise, Types.Type_id == Middle_expertise.Type_id)
                    .filter(Middle_expertise.Expert_id == expert.User_id)
                    .all()
                )
                # Convert list of tuples to a flat list
                tag_names = [tag.Type_name for tag in tags]
                full_name = " ".join(
                    filter(
                        None, [expert.First_name, expert.Middle_name, expert.Surname]
                    )
                )
                expert_data.append(
                    {
                        "Expert_id": expert.User_id,
                        "Full_Name": full_name,
                        "Tags": tag_names,
                    }
                )
            return jsonify({"Available Experts": expert_data}), 200

        except Exception as e:
            print("Error:", e)
            return jsonify({"Error": "Failed to retrieve experts"}), 500

    return jsonify({"message": "User has invalid access level"}), 401


@app.route("/api/update_item_auth", methods=["POST"])
def update_item_auth():
    """
    Assigns an expert to an item pending authentication.
    """
    if not current_user.is_authenticated:
        return jsonify({"message": "No user logged in"}), 401

    if current_user.Level_of_access == 3:
        data = request.json
        item_id = data.get("item_id")
        expert_id = data.get("expert_id")

        if not item_id or not expert_id:
            return jsonify({"message": "Missing item_id or expert_id"}), 400

        try:
            item = Items.query.filter_by(Item_id=item_id).first()
            if not item:
                return jsonify({"message": "Item not found"}), 404

            expert = User.query.filter_by(User_id=expert_id, Level_of_access=2).first()
            if not expert:
                return jsonify({"message": "Invalid expert ID"}), 404

            item.Expert_id = expert_id
            db.session.commit()

            return jsonify({"message": "Item successfully assigned to expert"}), 200

        except Exception as e:
            print("Error:", e)
            return jsonify({"Error": "Failed to update item authentication"}), 500

    return jsonify({"message": "User has invalid access level"}), 401


@app.route("/api/get-profit-structure", methods=["GET"])
def get_profit_structure():
    """
    Retrieves the most recent profit structure from the database.

    Returns:
        json_object: containing the most recent profit structure's details
        status_code: HTTP status code (200 for success, 404 for incorrect level of access / no user, 500 for server error)
    """
    if current_user.is_authenticated:
        try:
            # Fetch the most recent profit structure, ordering by enforced_datetime descending
            prof_struct = Profit_structure.query.order_by(
                Profit_structure.Enforced_datetime.desc()
            ).first()

            if prof_struct:
                # Create a dictionary to return the profit structure details
                profit_data = {
                    "structure_id": prof_struct.Structure_id,
                    "expert_split": prof_struct.Expert_split,
                    "manager_split": prof_struct.Manager_split,
                    "enforced_datetime": prof_struct.Enforced_datetime,
                }

                return jsonify({"profit_data": profit_data}), 200
            else:
                return (
                    jsonify(
                        {
                            "profit_data": {
                                "expert_split": 0.04,
                                "manager_split": 0.01,
                                "enforced_datetime": datetime.datetime.now(
                                    datetime.timezone.utc
                                ),
                            }
                        }
                    ),
                    200,
                )

        except Exception as e:
            import traceback

            print(
                "Error retrieving profit structure:", traceback.format_exc()
            )  # Print full error stack
            return jsonify({"Error": "Failed to retrieve profit structure"}), 500
    else:
        return jsonify({"message": "No user logged in"}), 401


@app.route("/api/update-profit-structure", methods=["POST"])
def update_profit_structure():
    """
    Appends a new profit structure to the database based on the manager's request.

    Returns:
        json_object: status of how the structure update went
        status_code: HTTP status code (200 for success, 400 for validation errors, 401 for incorrect level of access / no user, 500 for server error)
    """
    if current_user.is_authenticated:
        if current_user.Level_of_access == 3:
            try:
                data = request.get_json()
                manager_split = data.get("managerSplit")
                expert_split = data.get("expertSplit")

                if expert_split is None or manager_split is None:
                    return (
                        jsonify(
                            {"message": "Expert split and Manager split are required"}
                        ),
                        400,
                    )

                if not (0 <= expert_split <= 1) or not (0 <= manager_split <= 1):
                    return jsonify({"message": "Splits must be between 0 and 1."}), 400

                user = 1 - (expert_split + manager_split)

                if user < 0:
                    return jsonify({"message": "User split cannot be below zero"}), 400

                new_profit_structure = Profit_structure(
                    Expert_split=expert_split,
                    Manager_split=manager_split,
                    Enforced_datetime=datetime.datetime.now(datetime.timezone.utc),
                )

                db.session.add(new_profit_structure)
                db.session.commit()

                return (
                    jsonify({"message": "Profit structure updated successfully!"}),
                    200,
                )

            except Exception as e:
                return jsonify({"error": str(e)}), 500
        else:
            return jsonify({"message": "User is not on correct level of access!"}), 401
    else:
        return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get-sold", methods=["GET"])
def get_sold():
    """
    Fetches all the sold items (items that are past their 'available_until' dates) and links with the profit structure.

    Returns:
        json_object: details of all the items that were "sold"
        status_code: HTTP status code (200 for success, 401 for incorrect level of access / no user, 500 for server error)
    """
    if current_user.is_authenticated:
        if current_user.Level_of_access == 3:
            try:
                sold_items = (
                    Items.query.outerjoin(
                        Profit_structure,
                        Items.Structure_id == Profit_structure.Structure_id,
                    )
                    .join(Bidding_history, Items.Item_id == Bidding_history.Item_id)
                    .filter(

                        Items.Available_until
                        < datetime.datetime.now(datetime.timezone.utc),
                        Bidding_history.Winning_bid == 1,
                    )
                    .with_entities(
                        Items.Item_id,
                        Items.Listing_name,
                        Items.Seller_id,
                        Items.Upload_datetime,
                        Items.Available_until,
                        Items.Min_price,
                        Items.Current_bid,
                        Items.Structure_id,
                        Items.Expert_id,
                        Items.Verified,
                        Profit_structure.Expert_split,
                        Profit_structure.Manager_split,
                        Profit_structure.Enforced_datetime,
                        Items.Authentication_request,
                        Items.Authentication_request_approved,
                        Bidding_history.Bid_price,
                    )
                )

                sold_items_data = []
                for item in sold_items:

                    if item.Authentication_request_approved == 1 and item.Verified == 1:
                        if item.Structure_id is None:
                            eSplit = 0.04
                            mSplit = 0.01
                        else:
                            eSplit = item.Expert_split
                            mSplit = item.Manager_split
                    else:
                        if item.Structure_id:
                            mSplit = item.Manager_split
                            eSplit = 0
                        else:
                            mSplit = 0.01
                            eSplit = 0

                    sold_items_data.append(
                        {
                            "Item_id": item.Item_id,
                            "Listing_name": item.Listing_name,
                            "Seller_id": item.Seller_id,
                            "Upload_datetime": item.Upload_datetime,
                            "Available_until": item.Available_until,
                            "Min_price": item.Min_price,
                            "Current_bid": item.Current_bid,
                            "Structure_id": item.Structure_id,
                            "Expert_id": item.Expert_id,
                            "Expert_split": eSplit,
                            "Manager_split": mSplit,
                            "Enforced_datetime": item.Enforced_datetime,
                            "Authentication_request": item.Authentication_request,
                            "Authentication_request_approved": item.Authentication_request_approved,
                            "Bid_price": item.Bid_price,
                        }
                    )

                return jsonify({"sold_items": sold_items_data}), 200

            except Exception as e:
                return jsonify({"error": f"Server error: {str(e)}"}), 500
        else:
            return jsonify({"message": "User is not on correct level of access!"}), 401
    else:
        return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get-single-listing", methods=["POST"])
def get_single_listing():
    """
    Gets listing information for a given item ID

    Returns:
        json_object:  containing the item details
        status_code: HTTP status code (200 for success,
                                       400 for error)
    """

    try:
        data = request.json

        item = Items.query.filter_by(Item_id=data["Item_id"]).first()
        seller = User.query.filter_by(User_id=item.Seller_id).first()
        images = Images.query.filter_by(Item_id=item.Item_id).all()

        tags = (
            db.session.query(Types.Type_name)
            .join(Middle_type, Types.Type_id == Middle_type.Type_id)
            .filter(Middle_type.Item_id == data["Item_id"])
            .all()
        )

        buyer_info = None
        if item.Sold:
            winning_bid = (
                db.session.query(Bidding_history, User)
                .join(User, Bidding_history.Bidder_id == User.User_id)
                .filter(
                    Bidding_history.Item_id == item.Item_id,
                    Bidding_history.Winning_bid == True,
                )
                .first()
            )
            if winning_bid:
                buyer_info = {
                    "buyer_name": f"{winning_bid[1].First_name} {winning_bid[1].Surname}",
                    "buyer_username": winning_bid[1].Username,
                    "sold_price": winning_bid[0].Bid_price,
                }

        item_details = {
            "Current_bid": item.Current_bid,
            "Item_id": item.Item_id,
            "Listing_name": item.Listing_name,
            "Description": item.Description,
            "Seller_id": item.Seller_id,
            "Seller_name": seller.First_name + " " + seller.Surname,
            "Seller_username": seller.Username,
            "Expert_id": item.Expert_id,
            "Upload_datetime": item.Upload_datetime,
            "Min_price": item.Min_price,
            "Approved": item.Authentication_request_approved,
            "Second_opinion": item.Second_opinion,
            "Current_bid": item.Current_bid,
            "Images": [
                base64.b64encode(image.Image).decode("utf-8") for image in images
            ],
            "Available_until": item.Available_until,
            "Verified": item.Verified,
            "Tags": [tag[0] for tag in tags],
            "Sold": item.Sold,
            "Buyer_info": buyer_info,
        }

        return jsonify(item_details), 200

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to retrieve items"}), 400


@app.route("/api/request-second-opinion", methods=["POST"])
def request_second_opinion():
    """
    Updates Item details - unassigns expert ID and sets Second_opinion
    flag to true

    Returns:
        json_object:  containing success or error message
        status_code: HTTP status code (200 for success,
                                       401 for unauthorized access)
    """

    # Checks if the user is logged in
    if current_user.is_authenticated:
        if current_user.Level_of_access == 2:
            data = request.json
            item = Items.query.filter_by(Item_id=data["Item_id"]).first()

            item.Second_opinion = True
            item.Expert_id = None

            db.session.commit()

            return jsonify({"message": "Details Updated Successfully"}), 200

        return jsonify({"message": "Invalid Level of Access"}), 401

    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get-watchlist", methods=["GET"])
def get_watchlist():
    """
    Retrieves the user's watchlist items if they are currently logged in.

    Returns:
        json_object: dictionary containing the user's watchlist items
        status_code: HTTP status code (200 for success, 401 for unauthorized access)
    """
    if current_user.is_authenticated:
        # Fetch all watchlist items in one query
        watchlist_items = (
            Watchlist.query.join(
                Items, Watchlist.Item_id == Items.Item_id
            )  # Join Items table
            .join(User, Items.Seller_id == User.User_id)  # Join Users table
            .filter(Watchlist.User_id == current_user.User_id)
            .with_entities(
                Items.Item_id,
                Items.Listing_name,
                Items.Description,
                Items.Current_bid,
                Items.Available_until,
                User.Username.label("Seller_name"),
                Items.Min_price,
            )
            .all()
        )

        if not watchlist_items:
            return jsonify({"message": "No items in watchlist"}), 200

        # Convert query results to JSON
        watchlist_data = []
        for item in watchlist_items:
            # Fetch all images for the current item
            images = Images.query.filter_by(Item_id=item.Item_id).all()
            image_list = []

            for image in images:
                image_data = image.Image
                image_base64 = (
                    base64.b64encode(image_data).decode("utf-8") if image_data else None
                )
                image_list.append(
                    {
                        "Image": image_base64,
                        "Image_description": (
                            image.Image_description
                            if image.Image_description
                            else "No description available"
                        ),
                    }
                )

            tags = (
                db.session.query(Types.Type_name)
                .join(Middle_type, Types.Type_id == Middle_type.Type_id)
                .filter(Middle_type.Item_id == item.Item_id)
                .all()
            )

            tag_list = [tag.Type_name for tag in tags]

            watchlist_data.append(
                {
                    "Item_id": item.Item_id,
                    "Listing_name": item.Listing_name,
                    "Description": item.Description,
                    "Current_bid": item.Current_bid,
                    "Min_price": item.Min_price if item.Min_price is not None else 0,
                    "Available_until": item.Available_until,
                    "Seller_name": item.Seller_name,
                    "Images": image_list,
                    "Tags": tag_list,
                }
            )

        return jsonify({"watchlist": watchlist_data}), 200

    else:
        return jsonify({"message": "No user logged in"}), 401


@app.route("/api/remove-watchlist", methods=["POST"])
def remove_watchlist():
    """
    Removes an item from the user's watchlist if they are logged in.

    Returns:
        json_object: success message or error message
        status_code: HTTP status code (200 for success, 400 for bad request, 401 for unauthorized access)
    """
    if current_user.is_authenticated:

        data = request.get_json()
        item_id = data.get("item_id")

        if not item_id:
            return jsonify({"message": "Missing item IDr"}), 400

        # Find the watchlist entry
        watchlist_entry = Watchlist.query.filter_by(
            User_id=current_user.User_id, Item_id=item_id
        ).first()

        if not watchlist_entry:
            return jsonify({"message": "Item not found in watchlist"}), 404

        # Remove the item from the watchlist
        db.session.delete(watchlist_entry)
        db.session.commit()

        return jsonify({"message": "Item removed from watchlist"}), 200
    else:
        return jsonify({"message": "No user logged in"}), 401


@app.route("/api/add-watchlist", methods=["POST"])
def add_watchlist():
    """
    Adds an item to the user's watchlist if they are logged in.

    Returns:
        json_object: success message or error message
        status_code: HTTP status code (200 for success, 400 for bad request, 401 for unauthorized access, 405 for conflict)
    """
    if current_user.is_authenticated:

        data = request.get_json()
        item_id = data.get("item_id")

        if not item_id:
            return jsonify({"message": "Missing item ID"}), 400

        # Check if item already exists in the watchlist
        existing_entry = Watchlist.query.filter_by(
            User_id=current_user.User_id, Item_id=item_id
        ).first()
        if existing_entry:
            return jsonify({"message": "Item already in watchlist"}), 405

        # Add new watchlist entry
        new_watchlist_entry = Watchlist(User_id=current_user.User_id, Item_id=item_id)
        db.session.add(new_watchlist_entry)
        db.session.commit()

        return jsonify({"message": "Item added to watchlist"}), 200
    else:
        return jsonify({"message": "No user logged in"}), 401


@app.route("/api/check-watchlist", methods=["GET"])
def check_watchlist():
    """
    Checks if an item is in the user's watchlist.

    Returns:
        json_object: Boolean result or error message.
        status_code: HTTP status code (200 for success, 400 for bad request, 401 for unauthorized access).
    """
    if current_user.is_authenticated:
        item_id = request.args.get("Item_id")

        if not item_id:
            return jsonify({"message": "Missing item ID"}), 400

        checking_entry = Watchlist.query.filter_by(
            User_id=current_user.User_id, Item_id=item_id
        ).first()

        if checking_entry:
            return jsonify({"in_watchlist": True}), 200
        else:
            return jsonify({"in_watchlist": False}), 200
    else:
        return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get-tags", methods=["GET"])
def get_tags():
    """
    Gets all the tags from the tags table

    Returns:
        json_object: A list of all the tags and their respective ids
        status_code: HTTP status code (200 for success, 400 for bad request)
    """

    try:
        # Checks if the types are available
        available_types = db.session.query(Types).all()

        return (
            jsonify(
                [
                    {"Type_id": t.Type_id, "Type_name": t.Type_name}
                    for t in available_types
                ]
            ),
            200,
        )

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to retrieve types"}), 400


@app.route("/api/set-availability", methods=["POST"])
def set_availability():
    """
    Sets the availabilities for each user.
    If the expert has already set availabilities for the upcoming week, the existing records are deleted and replaced with the new ones
    """
    try:
        data = request.json
        availability = data.get("availability")
        week_start_date = data.get("week_start_date")

        # Deletes all existing availabilites for the same upcoming week
        existing_availabilities = Availabilities.query.filter(
            Availabilities.Expert_id == current_user.User_id,
            Availabilities.Week_start_date
            == datetime.datetime.strptime(week_start_date, "%Y-%m-%d").date(),
        ).delete()

        # Goes through each of the days and the time blocks, then add each new block to the availability table.

        for day, time_blocks in availability.items():
            days = [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ].index(day) + 1
            for block in time_blocks:
                new_availability = Availabilities(
                    Expert_id=current_user.User_id,
                    Day_of_week=days,
                    Start_time=datetime.datetime.strptime(
                        block["start_time"], "%H:%M"
                    ).time(),
                    End_time=datetime.datetime.strptime(
                        block["end_time"], "%H:%M"
                    ).time(),
                    Week_start_date=datetime.datetime.strptime(
                        week_start_date, "%Y-%m-%d"
                    ).date(),
                )
                db.session.add(new_availability)

        # Commits to complete the transaction
        db.session.commit()

        # Returns a success message and a status code of 200 (ok)
        return jsonify({"message": "Availability set successfully"}), 200

    except Exception as e:
        # If there are any errors, then we need to rollback to ensure the integrity of our database.
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({"error": "Failed to set availability"}), 500


@app.route("/api/get-availabilities", methods=["POST"])
def get_availabilites():
    """
    Gets all the availabilities for a certain expert for a certain week.

    Returns:
        json_object: A list of all the availabilities
        status_code: HTTP status code (200 for success, 400 for bad request)
    """

    try:
        data = request.get_json()
        week_start_date = data.get("week_start_date")

        availabilities = Availabilities.query.filter_by(
            Expert_id=current_user.User_id, Week_start_date=week_start_date
        ).all()

        availability_data = []
        for availability in availabilities:
            print(availability)
            availability_data.append(
                {
                    "Availability_id": availability.Availability_id,
                    "Expert_id": availability.Expert_id,
                    "Day_of_week": availability.Day_of_week,
                    "Start_time": availability.Start_time.strftime("%H:%M"),
                    "End_time": availability.End_time.strftime("%H:%M"),
                    "Week_start_date": availability.Week_start_date.strftime(
                        "%Y-%m-%d"
                    ),
                }
            )

        return jsonify(availability_data), 200
    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error: Failed to retrieve availabilities"}), 400


@app.route("/api/get-experts", methods=["POST"])
def get_experts():
    """
    Gets all the experts and whether they are available this week or not.

    Returns:
        json_object: A list of all the experts
        status_code: HTTP status code (200 for success, 400 for bad request)
    """

    try:
        data = request.get_json()
        week_start_date = data.get("week_start_date")
        current_day = data.get("current_day")

        experts = User.query.filter_by(Level_of_access=2).all()

        experts_data = []
        for expert in experts:

            is_available = db.session.query(
                exists().where(
                    and_(
                        Availabilities.Expert_id == expert.User_id,
                        Availabilities.Week_start_date == week_start_date,
                        Availabilities.Day_of_week >= current_day,
                    )
                )
            ).scalar()

            all_expertise = []

            expertise = Middle_expertise.query.filter_by(Expert_id=expert.User_id).all()
            for this_expertise in expertise:
                this_expertise_name = Types.query.filter_by(
                    Type_id=this_expertise.Type_id
                ).first()
                all_expertise.append(this_expertise_name.Type_name)

            experts_data.append(
                {
                    "User_id": expert.User_id,
                    "First_name": expert.First_name,
                    "Middle_name": expert.Middle_name,
                    "Surname": expert.Surname,
                    "Email": expert.Email,
                    "DOB": expert.DOB.strftime("%Y-%m-%d"),
                    "is_available": is_available,
                    "Expertise": all_expertise,
                }
            )

        return jsonify(experts_data), 200

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to retrieve experts"}), 400


@app.route("/api/add-expertise", methods=["POST"])
def add_expertise():
    """
    Adds all the tags to the expert.

    Returns:
        status_code: HTTP status code (200 for success, 400 for bad request)

    """
    try:
        data = request.get_json()
        expertise_ids = data.get("expertise_ids", [])
        expert_id = data.get("expert_id")

        for type_id in expertise_ids:
            print(type_id)
            existing_expertise = Middle_expertise.query.filter_by(
                Expert_id=expert_id, Type_id=type_id
            ).first()

            if not existing_expertise:
                new_expertise = Middle_expertise(Expert_id=expert_id, Type_id=type_id)
                db.session.add(new_expertise)

        db.session.commit()
        return jsonify({"Message": "Expertise added successfully"}), 200

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to add expertise"}), 400


@app.route("/api/remove-expertise", methods=["POST"])
def remove_expertise():
    """
    Removes all the tags to the expert.

    Returns:
        status_code: HTTP status code (200 for success, 400 for bad request)

    """
    try:
        data = request.get_json()
        expertise_ids = data.get("expertise_ids", [])
        expert_id = data.get("expert_id")

        for type_id in expertise_ids:
            existing_expertise = Middle_expertise.query.filter_by(
                Expert_id=expert_id, Type_id=type_id
            ).first()

            if existing_expertise:
                db.session.delete(existing_expertise)

        db.session.commit()
        return jsonify({"Message": "Expertise removed successfully"}), 200

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to remove expertise"}), 400


@app.route("/api/get-listing-details/<int:item_id>", methods=["POST"])
def get_listing_details(item_id):
    """
    Retrieves detailed information about a specific listing for editing.
    """
    try:
        item = Items.query.filter_by(
            Item_id=item_id, Seller_id=current_user.User_id
        ).first()
        if not item:
            return jsonify({"error": "Listing not found or access denied"}), 404

        now = datetime.datetime.now(datetime.timezone.utc)
        remaining_days = (item.Available_until - item.Upload_datetime).days

        images = Images.query.filter_by(Item_id=item_id).all()
        image_data = [
            {"image_id": img.Image_id, "description": img.Image_description}
            for img in images
        ]

        tags = (
            db.session.query(Types.Type_id, Types.Type_name)
            .join(Middle_type, Types.Type_id == Middle_type.Type_id)
            .filter(Middle_type.Item_id == item_id)
            .all()
        )

        return (
            jsonify(
                {
                    "listing_name": item.Listing_name,
                    "description": item.Description,
                    "min_price": item.Min_price,
                    "days_available": remaining_days,
                    "images": image_data,
                    "tags": [
                        {"type_id": t.Type_id, "type_name": t.Type_name} for t in tags
                    ],
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Error getting listing details: {e}")
        return jsonify({"error": "Failed to retrieve listing details"}), 500


@app.route("/api/update-listing", methods=["POST"])
def update_listing():
    """
    Updates an existing listing with new information.
    """
    try:
        item_id = request.form.get("item_id")
        if not item_id:
            return jsonify({"error": "Item ID is required"}), 400

        # Verify the item belongs to the current user
        item = Items.query.filter_by(
            Item_id=item_id, Seller_id=current_user.User_id
        ).first()
        if not item:
            return jsonify({"error": "Listing not found or access denied"}), 404

        # Validate required fields
        if not all(
            key in request.form
            for key in [
                "listing_name",
                "listing_description",
                "minimum_price",
                "days_available",
            ]
        ):
            return jsonify({"error": "Missing required fields"}), 400

        # Update basic item information
        item.Listing_name = request.form["listing_name"]
        item.Description = request.form["listing_description"]
        item.Min_price = float(request.form["minimum_price"])

        # Set new available until date
        days_available = int(request.form["days_available"])
        time_now = datetime.datetime.now(datetime.timezone.utc)
        item.Upload_datetime = time_now
        item.Available_until = time_now + datetime.timedelta(days=days_available)
        item.Current_bid = 0
        item.Sold = False

        # Handle tags
        tags = json.loads(request.form.get("tags", "[]"))

        # Remove existing tags
        Middle_type.query.filter_by(Item_id=item_id).delete()

        # Add new tags
        for tag_id in tags:
            db.session.add(Middle_type(Item_id=item_id, Type_id=tag_id))

        # Handle images
        images_to_keep = json.loads(request.form.get("images_to_keep", "[]"))

        # Delete images not being kept
        Images.query.filter(
            Images.Item_id == item_id, ~Images.Image_id.in_(images_to_keep)
        ).delete()

        # Add new images
        if "new_images" in request.files:
            for image in request.files.getlist("new_images"):
                db.session.add(
                    Images(
                        Item_id=item_id,
                        Image=image.read(),
                        Image_description="Item image",
                    )
                )

        db.session.commit()

        # Reschedule the auction end task
        try:
            schedule_auction(item)
        except Exception as e:
            print(f"Error rescheduling auction: {e}")

        return jsonify({"message": "Listing updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating listing: {e}")
        return jsonify({"error": "Failed to update listing"}), 500
