from app import app, db, admin

from flask import render_template, flash, request, redirect, url_for, send_file, Flask, jsonify
from flask_admin.contrib.sqla import ModelView
from flask_login import login_user, login_required, logout_user, current_user
from flask_wtf.csrf import generate_csrf
from flask_cors import CORS

from .models import User, Address, Payment, Items, Images, Middle_type, Types, Watchlist, Bidding_history
from .forms import login_form, sign_up_form

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


# Not react compatible yet
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("home"))


# React compatible 
@app.route("/api/login", methods=["POST"])
def login():
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
    return jsonify({"message": "Login successful"}), 200
    
    
@app.route("/api/signup", methods=["POST"])
def signup():
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

