from app import app, db, admin
import base64

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

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

import datetime

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
        Middle_name=data["middle_name"].capitalize(),
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
                }
            ),
            200,
        )

    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get_all_users", methods=["POST"])
def get_all_users():
    print("Wuery reached")

    users = User.query.all()
    print("USERS:",users)
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
        }

        # If the user is an expert, retrieve their expertise types
        if user_details.Level_of_access == 2:
            expertise_types = (
                db.session.query(Types.Type_name)
                .join(Middle_expertise, Types.Type_id == Middle_expertise.Type_id)
                .filter(Middle_expertise.Expert_id == user_id)
                .all()
            )
            user_details_dict["expertise_types"] = [type_name[0] for type_name in expertise_types]

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

@app.route("/api/update_level", methods = ["POST"])
def update_level():
    print("REACHED update_level")
    try :
        data = request.json
        user_ids = data.get("user_id", "")
        new_levels = data.get("level_of_access", "")
        for i in range(len(user_ids)) :
            user = User.query.filter_by(User_id = user_ids[i]).first()
            # print(f"will update user_id {user_ids[i]} to level : {new_levels[i]}")

            if not user :
                return jsonify({"error" : "User no found"}), 404
            
            user.Level_of_access = new_levels[i]
            db.session.commit()
        
        return jsonify({"message": "Levels updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/get_search_filter", methods =["POST"])
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
    user = data.get("user","")
    item = data.get("item", "")
    searchQuery = (data.get("searchQuery", "")).strip().lower()
    # print("SEARCH QUERY IN BACKEND", searchQuery)
    # print("ITEM", item)
    filtered_ids = []
    # if user == True:
    #     print("user : true")
    # elif item == True:
    #     print("item :true")
    # else :
    #     print("both false")
    
    filtered_items = []
    filtered_users =[]
   

    if item:
        # print("in item bool")
        if not searchQuery:
                # Return all items
            # print("Empty search Query")
            filtered_items = db.session.query(Items).all()
            # print(filtered_items)
        else:     
        # filter by item name, works with space seperated strings
            item_names_and_Ids = (db.session.query(Items.Listing_name,Items.Item_id).all())
            for name, item_id in item_names_and_Ids :
                name_tokens = name.split()
                search_tokens = searchQuery.split()

                # print(name_tokens)
                for i in range(len(name_tokens) - len(search_tokens) + 1):
                    if all(name_tokens[i + j].startswith(search_tokens[j]) for j in range(len(search_tokens))): 
                        filtered_ids.append(item_id)
            
            # filter by item_tags, works for tags that have more than one word
            type_names = (db.session.query(Types.Type_name, Items.Item_id).join(Middle_type, Middle_type.Item_id == Items.Item_id).join(Types, Types.Type_id == Middle_type.Type_id).all())
            
            for tag_name, item_id in type_names:
                tag_name_tokens = tag_name.split()
                for i in range(len(tag_name_tokens) - len(search_tokens) + 1):
                    # print("Search tags",search_tokens)
                    if all(tag_name_tokens[i + j].startswith(search_tokens[j]) for j in range(len(search_tokens))):
                    # ensure no duplicates of item_ids
                        if item_id not in filtered_ids: 
                            filtered_ids.append(item_id)
                            
            # print("Item Ids",filtered_ids) 
            #get items from filtered Ids
            filtered_items = db.session.query(Items).filter(Items.Item_id.in_(filtered_ids)).all()
            
        # Turn into dict
        items_list = []
        for item in filtered_items:
            image = Images.query.filter(Images.Item_id == item.Item_id).first()

            item_details_dict = {
                "Item_id": item.Item_id,
                "Listing_name": item.Listing_name,
                "Seller_id": item.Seller_id,
                "Available_until": item.Available_until,
                "Verified": item.Verified,
                "Min_price": item.Min_price,
                "Current_bid": item.Current_bid,
                "Image": base64.b64encode(image.Image).decode("utf-8") if image else None,
            }

            items_list.append(item_details_dict)                
            
        return jsonify(items_list), 200
        # Ensure Items model has a to_dict() method
    elif user :
        #for now just returns all
        if not searchQuery:
            filtered_users = db.session.query(User).all()
            print(filtered_users)
            
        else:
            # print("Searching users")
            filtered_user_ids = []
            
            # filtering by first, middle, last name
            user_names_and_Ids = db.session.query(User.First_name, User.Middle_name, User.Surname, User.User_id).all()
            for first, middle, last, user_id in user_names_and_Ids:
                name_tokens = [first.lower(), middle.lower(), last.lower()]
                # print("NAME", name_tokens)
                search_tokens = searchQuery.lower().split()
        
                # if searchQuery has two tokens, it matches both in the same sequence to the name token
                if len(search_tokens) > 1 :
                    # print("SEARCH", search_tokens)
                    matched = False
                    if len(search_tokens) <= len(name_tokens): 
                        # if name_tokens is greater than two, it matches first search_token to first name,
                        # second to middle name, third to last
                        if name_tokens[1] != "" :
                            for i in range(len(search_tokens)):
                                if not name_tokens[i].lower().startswith(search_tokens[i]):
                                    matched = False
                                    # print("NOT MATCHED : comparing name_toke", name_tokens[i], " with search query token ", search_tokens[i])
                                    break
                                else:
                                    # print("MATCHED : comparing name_toke", name_tokens[i], " with search query token ", search_tokens[i])
                                    matched = True
            
                        else:
                            #  if name has no middle name, then second search token should match with last name not middle name
                            if name_tokens[0] == search_tokens[0]:
                                # print("MATCHED : comparing name", name_tokens[0], " with search query token ", search_tokens[0])
                                if name_tokens[2].startswith(search_tokens[1]):
                                    # print("MATCHED : comparing name", name_tokens[2], " with search query token ", search_tokens[1])
                                    matched = True
                                else :
                                    matched = False
                                    # print("NOT MATCHED : comparing name_toke", name_tokens[2], " with search query token ", search_tokens[1])
                            else :
                                matched = False
                                # print("NOT MATCHED : comparing name_toke", name_tokens[0], " with search query token ", search_tokens[0])

                            
                    if matched:
                        filtered_user_ids.append(user_id)
                        # print("ID added", user_id)
                        
                        
                elif len(search_tokens) == 1 :
                    for i in range(len(name_tokens)):
                        if name_tokens[i].lower().startswith(search_tokens[0]):
                            filtered_user_ids.append(user_id)

                        
                            
            
            filtered_users = db.session.query(User).filter(User.User_id.in_(filtered_user_ids)).all()
            # print(filtered_users)
            
            #filtering by expert tags, not yet implemnetd in db
            # if user.Is_expert : filter by tags
        users_list = []
        for user in filtered_users:

            user_details_dict = {
                "User_id": user.User_id,
                "Username": user.Username,
                "Password" : user.Password,
                "Email": user.Email, 
                "First_name": user.First_name,
                "Middle_name": user.Middle_name,
                "Surname": user.Surname,
                "DOB": user.DOB,
                "Level_of_access": user.Level_of_access,
                "Is_expert": user.Is_expert
            }

            users_list.append(user_details_dict)                

        return jsonify(users_list), 200



    
                
            
    # print([item_id for item_id, in db.session.query(Items.Item_id).all()])
    # all_items = db.session.query(Items).all()
    # return jsonify([item.to_dict() for item in all_items])

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
        price_range = data.get("price_range", "")
        listing_Ids = data.get("listing_Ids", [])
        listing_Ids = list(map(int, listing_Ids))
        filtered_listing_Ids = []
        # print("DATAAAA", data)
        if price_range != "":
            for Id in listing_Ids:
                item = Items.query.filter_by(Item_id=Id).first()
                print(item.Listing_name)
                if price_range == "less_than_50":
                    if get_listing_price(item) < 50:
                        filtered_listing_Ids.append(Id)
                elif price_range == "50_200":
                    if get_listing_price(item) >= 50 and get_listing_price(item) < 200:
                        filtered_listing_Ids.append(Id)
                elif price_range == "200_500":
                    if (
                        get_listing_price(item) >= 200
                        and get_listing_price(item) <= 500
                    ):
                        filtered_listing_Ids.append(Id)
                elif price_range == "more_than_500":
                    if get_listing_price(item) > 500:
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
                request_to_update.Available_until += (
                    datetime.datetime.now() - request_to_update.Upload_datetime
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

        time_now = datetime.datetime.now(datetime.UTC)
        time_after_days_available = datetime.datetime.now(
            datetime.UTC
        ) + datetime.timedelta(days=int(request.form["days_available"]))
        # Creates a new listing with given data
        listing = Items(
            Listing_name=request.form["listing_name"],
            Seller_id=float(request.form["seller_id"]),
            Verified=False,
            Upload_datetime=time_now,
            Available_until=time_after_days_available,
            Min_price=float(request.form["minimum_price"]),
            Current_bid=0,
            Description=request.form["listing_description"],
            Authentication_request=authentication_request,
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
                Items.Available_until > datetime.datetime.now(),
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
                    )
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
                Items.Available_until > datetime.datetime.now(),
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
                    )
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
                "Authentication_request": item.Authentication_request
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
                Items.Available_until > datetime.datetime.now(),  # Only valid bids
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
                }

        # Convert dictionary to list for JSON response
        current_bids = list(unique_bids.values())

        return jsonify({"bids": current_bids}), 200

    else:
        return jsonify({"message": "No user logged in"}), 401


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
                Items.Available_until < datetime.datetime.now(),  # Only expired bids
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
                    "Image_description": item.Image_description or "No Image",
                    "Min_price": item.Min_price,
                }

        # Convert dictionary to list for JSON response
        history = list(unique_bids.values())

        return jsonify({"history": history}), 200

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
                unassigned_data.append(
                    {
                        "Item_id": item.Item_id,
                        "Listing_name": item.Listing_name,
                        "Description": item.Description,
                        "Current_bid": item.Current_bid,
                        "Available_until": item.Available_until,
                        "Username": item.Username,
                        "Images": image_list,
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

                expert_data.append({
                    "Expert_id": expert.User_id,
                    "Username": expert.Username,
                    "Tags": tag_names
                })
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
                    return jsonify({"profit_data": {"expert_split": 0.04, "manager_split": 0.01, "enforced_datetime": datetime.datetime.now(datetime.UTC)}}), 200

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
                    Enforced_datetime=datetime.datetime.now(datetime.UTC)
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
                    .filter(Items.Available_until < datetime.datetime.now())
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
                        Items.Authentication_request_approved
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
            "Images": [
                base64.b64encode(image.Image).decode("utf-8") for image in images
            ],
            "Available_until" : item.Available_until
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


@app.route('/api/get-availabilities', methods=["POST"])
def get_availabilites():
    """
    Gets all the availabilities for a certain expert for a certain week.

    Returns:
        json_object: A list of all the availabilities
        status_code: HTTP status code (200 for success, 400 for bad request)
    """

    try:
        data = request.get_json()
        week_start_date = data.get('week_start_date')

        availabilities = Availabilities.query.filter_by(Expert_id = current_user.User_id, Week_start_date = week_start_date).all()

        availability_data = []
        for availability in availabilities:
            print(availability)
            availability_data.append({
                'Availability_id': availability.Availability_id,
                'Expert_id': availability.Expert_id,
                'Day_of_week': availability.Day_of_week,
                'Start_time': availability.Start_time.strftime('%H:%M'),
                'End_time': availability.End_time.strftime('%H:%M'),
                'Week_start_date': availability.Week_start_date.strftime('%Y-%m-%d')
            })
    
        return jsonify(availability_data), 200
    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error: Failed to retrieve availabilities"}), 400

@app.route('/api/get-experts', methods=["POST"])
def get_experts():
    """
    Gets all the experts and whether they are available this week or not.

    Returns:
        json_object: A list of all the experts
        status_code: HTTP status code (200 for success, 400 for bad request)
    """

    try:
        data = request.get_json()
        week_start_date = data.get('week_start_date')
        current_day = data.get("current_day")

        experts = User.query.filter_by(Level_of_access = 2).all()

        experts_data = []
        for expert in experts:

            is_available = db.session.query(
                exists().where(
                    and_(
                        Availabilities.Expert_id == expert.User_id,
                        Availabilities.Week_start_date == week_start_date,
                        Availabilities.Day_of_week >= current_day
                    )
                )
            ).scalar()

            all_expertise = []

            expertise = Middle_expertise.query.filter_by(Expert_id=expert.User_id).all()
            for this_expertise in expertise:
                this_expertise_name = Types.query.filter_by(Type_id=this_expertise.Type_id).first()
                all_expertise.append(
                    this_expertise_name.Type_name
                )

            experts_data.append({
                'User_id': expert.User_id,
                'First_name': expert.First_name,
                'Middle_name': expert.Middle_name,
                'Surname': expert.Surname,
                'Email': expert.Email,
                'DOB': expert.DOB.strftime('%Y-%m-%d'),
                'is_available': is_available,
                'Expertise': all_expertise
            })

        return jsonify(experts_data), 200
    
    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to retrieve experts"}), 400
    
@app.route('/api/add-expertise', methods=["POST"])
def add_expertise():
    """    
    Adds all the tags to the expert.

    Returns:
        status_code: HTTP status code (200 for success, 400 for bad request)
    
    """
    try:
        data = request.get_json()
        expertise_ids = data.get('expertise_ids', [])
        expert_id = data.get('expert_id')

        for type_id in expertise_ids:
            print(type_id)
            existing_expertise = Middle_expertise.query.filter_by(
                Expert_id = expert_id,
                Type_id = type_id
            ).first()
        
            if not existing_expertise:
                new_expertise = Middle_expertise(Expert_id = expert_id, Type_id = type_id)
                db.session.add(new_expertise)

        db.session.commit()
        return jsonify({"Message": "Expertise added successfully"}), 200

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to add expertise"}), 400
    
@app.route('/api/remove-expertise', methods=["POST"])
def remove_expertise():
    """    
    Removes all the tags to the expert.

    Returns:
        status_code: HTTP status code (200 for success, 400 for bad request)
    
    """
    try:
        data = request.get_json()
        expertise_ids = data.get('expertise_ids', [])
        expert_id = data.get('expert_id')

        for type_id in expertise_ids:
            existing_expertise = Middle_expertise.query.filter_by(
                Expert_id = expert_id,
                Type_id = type_id
            ).first()
        
            if existing_expertise:
                db.session.delete(existing_expertise)

        db.session.commit()
        return jsonify({"Message": "Expertise removed successfully"}), 200

    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to remove expertise"}), 400

