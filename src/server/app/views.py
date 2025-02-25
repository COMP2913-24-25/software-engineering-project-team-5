from app import app, db, admin

from flask import render_template, flash, request, redirect, url_for, send_file, Flask, jsonify, session
from flask_admin.contrib.sqla import ModelView
from flask_login import login_user, login_required, logout_user, current_user
from flask_wtf.csrf import generate_csrf
from flask_cors import CORS

from .models import User, Address, Payment, Items, Images, Middle_type, Types, Watchlist, Bidding_history
from .forms import LoginForm, SignUpForm, Create_listing_form

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
             "origins": "http://localhost:3000",
             "supports_credentials": True,
             "allow_headers": ["Content-Type"],
             "expose_headers": ["Content-Type"],
         }
     })


@app.route("/logout", methods=["POST"])
@login_required
def logout():
    session.clear()
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200


# React compatible 
@app.route("/api/login", methods=["POST"])
def login():
    # Requests the data from the front end as a JSON string.
    data = request.json
    
    # Create a form from the received data and validate it.
    form = LoginForm(data=data) 
    
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

@app.route("/api/user", methods=["GET"])
def get_user():
    if "user_id" in session:
        return jsonify({
            "user_id": session["user_id"],
            "first_name": session["first_name"],
            "level_of_access": session["level_of_access"],
            "is_expert": session["is_expert"]
        }), 200  
    
    return jsonify({"message": "No user logged in"}), 401
    
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    form = SignUpForm(data=data)
    errors = {}
    
    if User.query.filter_by(Email=data["email"]).first():
        errors["email"] = ["Email already exists"]

    if User.query.filter_by(Username=data["username"]).first():
        errors["username"] = ["Username already exists"]

    if data["password"] != data["passwordConfirmation"]:
        errors["passwordConfirmation"] = ["Passwords do not match"]

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


@app.route("/api/create-listing", methods=["POST"])
def Create_listing():
    form = Create_listing_form()

    # Validates form and collects any errors
    if not form.validate_on_submit():
        return jsonify({"errors": form.errors}), 400

    try:
        
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
            Description=request.form["listing_description"]
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

