from app import app, db, admin
import base64

from flask import render_template, flash, request, redirect, url_for, send_file, Flask, jsonify, session
from flask_admin.contrib.sqla import ModelView
from flask_login import login_user, login_required, logout_user, current_user
from flask_wtf.csrf import generate_csrf
from flask_cors import CORS
from sqlalchemy.orm import sessionmaker

from .models import User, Address, Payment, Items, Images, Middle_type, Types, Watchlist, Bidding_history
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


CORS(app, 
     resources={
         r"/api/*": {
             "origins": "http://localhost:5173",
             "supports_credentials": True,
             "allow_headers": ["Content-Type"],
             "expose_headers": ["Content-Type"],
         }
     })

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

    session["user_id"] = user_exists.User_id
    session["first_name"] = user_exists.First_name
    session["level_of_access"] = user_exists.Level_of_access
    session["is_expert"] = user_exists.Is_expert
    
    # Return a success message and a status code of 200 (ok)
    return jsonify({"message": "Login successful", "user": {
        "user_id": user_exists.User_id,
        "first_name": user_exists.First_name,
        "level_of_access": user_exists.Level_of_access,
        "is_expert": user_exists.Is_expert
    }}), 200


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
    login_user(user)
    
    # Returns a success message and a status code of 200 (ok)
    return jsonify({"message": "User created successfully"}), 200


@app.route("/logout", methods=["POST"])
@login_required
def logout():
    session.clear()
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/user", methods=["POST"])
def get_user():
    if "user_id" in session:
        return jsonify({
            "user_id": session["user_id"],
            "first_name": session["first_name"],
            "level_of_access": session["level_of_access"],
            "is_expert": session["is_expert"]
        }), 200  
    
    return jsonify({"message": "No user logged in"}), 401


@app.route("/api/get-user-details", methods=["POST"])
def get_user_details():
    """
    Retrieves the user's details from the database, if they 
    are currently logged in.

    Returns:
        json_object: dictionary containing the user's details
        status_code: HTTP status code (200 for success, 
                                       401 for unauthorized access)
    """
    
    if "user_id" in session:
        user_id = session["user_id"]
        user_details = User.query.filter_by(User_id = user_id).first()
        
        user_details_dict = {
            "First_name": user_details.First_name,
            "Middle_name": user_details.Middle_name,
            "Surname": user_details.Surname,
            "DOB": user_details.DOB.strftime("%Y-%m-%d"),
            "Email": user_details.Email,
            "Username": user_details.Username,
            "is_expert": user_details.Is_expert,
        }
    
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
    if "user_id" in session:
        user_id = session["user_id"]
        addresses = Address.query.filter_by(User_id=user_id).all()
        
        if addresses:
            addresses_list = []
            
            # Gets all the addresses related to the user
            for address in addresses:
                addresses_list.append({
                    "Address_id": address.Address_id,
                    "Line_1": address.Line_1,
                    "Line_2": address.Line_2,
                    "City": address.City,
                    "Country": address.Country,
                    "Postcode": address.Postcode,
                    "Region": address.Region,
                    "Is_billing": address.Is_billing
                })

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
    if "user_id" in session:
        if session["is_expert"] == True:
            user_id = session["user_id"]
            
            # Seperates Listings into pending and past authentication requests
            pending_auth_requests_list = []
            past_auth_requests_list = []
            
            # Retrieves all authentication requests related to the expert
            auth_requests = Items.query.filter_by(Expert_id=user_id).all()
            
            for req in auth_requests:
                seller = User.query.filter_by(User_id = req.Seller_id).first()
                temp = {
                        "Item_id": req.Item_id,
                        "Listing_name": req.Listing_name,
                        "Seller_id": seller.User_id,
                        "Seller_name": seller.First_name + " " + seller.Surname,
                        "Upload_datetime": req.Upload_datetime.strftime("%Y-%m-%d %H:%M:%S"),
                        "Min_price": req.Min_price,
                        "Description": req.Description,
                        "Verified": req.Verified
                    }
                
                # Adds the request to the appropriate list based on whether it's a pending or past request
                if req.Authentication_request:
                    pending_auth_requests_list.append(temp)
                else:
                    past_auth_requests_list.append(temp)
                
            return jsonify({"pending_auth_requests": pending_auth_requests_list,
                           "past_auth_requests": past_auth_requests_list}), 200
        
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
    if "user_id" in session:
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
        user_id = session["user_id"]
        user = User.query.get(user_id)
        user.First_name = data["First_name"].capitalize()
        user.Middle_name = data["Middle_name"].capitalize()
        user.Surname = data["Surname"].capitalize()
        user.DOB = DOB       
            
        db.session.commit()
        
        return jsonify({"message": "Details Updated Successfully"}), 200
        
    return jsonify({"message": "No user logged in"}), 401 
   

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
    if "user_id" in session:
        data = request.json
        user_id = session["user_id"]
        
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
                Is_billing=data["Is_billing"]
            )
            
            if data["Is_billing"]:
                addresses = Address.query.filter_by(User_id = user_id).all()
                
                if addresses is not None:
                    Address.query.filter_by(User_id=user_id).update({"Is_billing": False})
                    db.session.flush()
            
            db.session.add(new_address)
            db.session.commit()
    
            return jsonify({"message": "Address updated successfully"}), 200
        
        # If the User is updating an existing address...
        # Gets updated address
        address = Address.query.filter_by(User_id=user_id, Address_id=data["Address_id"]).first()

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
            address = Address.query.filter_by(Address_id = data["Address_id"]).first()
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
    if "user_id" in session:
        if session["is_expert"] == True:
            data = request.json
            user_id = session["user_id"]
            
            # Retrieves the request to be updated
            request_to_update = Items.query.filter_by(Item_id=data["request_id"]).first()
            
            # Updates information according to if the request was accepted or declined
            if data["action"] == "accept":
                request_to_update.Available_until += datetime.datetime.now() - request_to_update.Upload_datetime
                request_to_update.Verified = True
                request_to_update.Authentication_request = False
            else:
                request_to_update.Verified = False
                request_to_update.Authentication_request = False
            
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
    
    if "user_id" in session:
        data = request.json
        user_id = session["user_id"]
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
        time_after_days_available = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=int(request.form["days_available"]))
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
            Authentication_request=authentication_request
        )

        # Adds the item to the database and then flushes so that we can get listing.Item_id **IMPORTANT**
        db.session.add(listing)
        db.session.flush()


        # Goes through the images passed through and saves the necessary information to the saved_images list as Images objects.
        saved_images = []
        if 'images' in request.files:
            images = request.files.getlist("images")
            for image in images:
                image_record = Images(
                    Item_id = listing.Item_id,
                    Image = image.read(),
                    Image_description = "This is an image"
                )
                saved_images.append(image_record)
        
        #Bulk saves all the images in saved_images
        if saved_images:
            db.session.bulk_save_objects(saved_images)

        #Commits to complete the transaction
        db.session.commit()

    
        # Returns a success message and a status code of 200 (ok)
        return jsonify({"message": "Listing created successfully"}), 200
    
    except Exception as e:
        # If there are any errors, then we need to rollback to ensure the integrity of our database.
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({"error": "Failed to create listing in the backend"}), 500


@app.route("/api/get-items", methods=["GET"])
def get_listings():
    """
    Retrieves the item details from the database that are still available.

    Returns:
        json_object:  containing the items details
        status_code: HTTP status code (200 for success, 
                                       401 for unauthorized access)
    """

    try:
        available_items = db.session.query(Items, User.Username).join(User, Items.Seller_id == User.User_id).filter(Items.Available_until > datetime.datetime.now()).all()
        
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
                "Image": base64.b64encode(image.Image).decode("utf-8")
            }
            items_list.append(item_details_dict)
            
        return jsonify(items_list), 200
    
    except Exception as e:
        print("Error: ", e)
        return jsonify({"Error": "Failed to retrieve items"}), 401


@app.route("/api/get-watchlist", methods=["POST"])
def get_watchlist():
    """
    Retrieves the user's watchlist items if they are currently logged in.

    Returns:
        json_object: dictionary containing the user's watchlist items
        status_code: HTTP status code (200 for success, 401 for unauthorized access)
    """
    if "user_id" in session:
        user_id = session["user_id"]
        
        # Fetch all watchlist items in one query
        watchlist_items = (
            Watchlist.query
            .join(Items, Watchlist.Item_id == Items.Item_id)  # Join Items table
            .join(User, Items.Seller_id == User.User_id)  # Join Users table
            .outerjoin(Images, Items.Item_id == Images.Item_id)  # Join Images table
            .filter(Watchlist.User_id == user_id)
            .with_entities(
                Items.Item_id, Items.Listing_name, Items.Description, Items.Current_bid, 
                Items.Available_until, User.Username.label("Seller_name"), 
                Images.Image, Images.Image_description, Items.Min_price
            )
            .all()
        )

        if not watchlist_items:
            return jsonify({"message": "No items in watchlist"}), 200

        # Convert query results to JSON
        watchlist_data = []
        for item in watchlist_items:
            image_data = item.Image
            image_base64 = None
            if image_data:
                # Base64 encode the image if it exists
                image_base64 = base64.b64encode(image_data).decode('utf-8')

            watchlist_data.append({
                "Item_id": item.Item_id,
                "Listing_name": item.Listing_name,
                "Description": item.Description,
                "Current_bid": item.Current_bid,
                "Min_price": item.Min_price if item.Min_price is not None else 0,
                "Available_until": item.Available_until,
                "Seller_name": item.Seller_name,
                "Image": image_base64,
                "Image_description": item.Image_description if item.Image_description else "No description available"
            })

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
    if "user_id" not in session:
        return jsonify({"message": "No user logged in"}), 401

    data = request.get_json()
    item_id = data.get("itemId")

    if not item_id:
        return jsonify({"message": "Missing item ID"}), 400

    user_id = session["user_id"]

    # Find the watchlist entry
    watchlist_entry = Watchlist.query.filter_by(User_id=user_id, Item_id=item_id).first()

    if not watchlist_entry:
        return jsonify({"message": "Item not found in watchlist"}), 404

    # Remove the item from the watchlist
    db.session.delete(watchlist_entry)
    db.session.commit()

    return jsonify({"message": "Item removed from watchlist"}), 200
     

@app.route("/api/add-watchlist", methods=["POST"])
def add_watchlist():
    """
    Adds an item to the user's watchlist if they are logged in.

    Returns:
        json_object: success message or error message
        status_code: HTTP status code (200 for success, 400 for bad request, 401 for unauthorized access, 409 for conflict)
    """
    if "user_id" not in session:
        return jsonify({"message": "No user logged in"}), 401

    data = request.get_json()
    item_id = data.get("Item_id")

    if not item_id:
        return jsonify({"message": "Missing item ID"}), 400

    user_id = session["user_id"]

    # Check if item already exists in the watchlist
    existing_entry = Watchlist.query.filter_by(User_id=user_id, Item_id=item_id).first()
    if existing_entry:
        return jsonify({"message": "Item already in watchlist"}), 409  # Conflict status

    # Add new watchlist entry
    new_watchlist_entry = Watchlist(User_id=user_id, Item_id=item_id)
    db.session.add(new_watchlist_entry)
    db.session.commit()

    return jsonify({"message": "Item added to watchlist"}), 200



