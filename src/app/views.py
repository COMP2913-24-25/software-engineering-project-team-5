from app import app, db, admin

from flask import render_template, flash, request, redirect, url_for
from flask_admin.contrib.sqla import ModelView
from flask_login import login_user, login_required, logout_user, current_user
from flask_wtf.csrf import generate_csrf
from flask import send_file

from .models import User, Address, Payment, Items, Images, Middle_type, Types, Watchlist, Bidding_history
from .forms import LoginForm, SignUpForm

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename


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


@app.route("/", methods=["POST","GET"])
def home():
    return redirect(url_for("signup"))


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("home"))


@app.route("/login", methods=["GET", "POST"])
def login():
    """
    Validates the users log in details to log them into the 
    website, thus giving them access to more features.
    """
    form = LoginForm()
    
    if form.validate_on_submit(): 
        email_or_username = form.email_or_username.data
        password_entered = form.password.data
        
        # Checks if the login detail is email or username
        user_exists = User.query.filter_by(Email=email_or_username).first()
        if not user_exists:
            user_exists = User.query.filter_by(Username=email_or_username).first()
        
        # If either email or username found:
        if user_exists and check_password_hash(user_exists.Password, password_entered):
            login_user(user_exists, remember=True)
            return redirect(url_for("home"))
        else:
            flash("Invalid email or password.")
    
    return render_template("login.html", form=form, user=current_user)


@app.route("/signup", methods=["GET", "POST"])
def signup():
    """
    Lets a new user sign up to the platform.
    """
    
    form = SignUpForm()
    
    if form.validate_on_submit():
        if form.password.data != request.form.get("passwordConfirmation"):
            flash("Passwords do not match.")
            return redirect("/signup")
        
        if User.query.filter_by(Email=form.email.data).first():
            flash("An account with the email already exists.")
            return redirect("/signup")
        
        if User.query.filter_by(Username=form.username.data).first():
            flash("An account with the email already exists.")
            return redirect("/signup")

            
        user = User(First_name = form.first_name.data.capitalize(), 
                    Middle_name = form.middle_name.data.capitalize(), 
                    Surname = form.surname.data.capitalize(),
                    DOB = form.DOB.data,
                    Username = form.username.data,
                    Email = form.email.data,
                    Password = generate_password_hash(form.password.data),
                    Level_of_access=1,
                    Is_expert=False)
        
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        if current_user.is_authenticated:
            return redirect(url_for("login")) 
    
    return render_template("signup.html", form=form, user=current_user)