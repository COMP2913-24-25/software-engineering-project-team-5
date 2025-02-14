from app import app, db, admin

from flask import render_template, flash, request, redirect, url_for
from flask_admin.contrib.sqla import ModelView
from flask_login import login_user, login_required, logout_user, current_user
from flask_wtf.csrf import generate_csrf
from flask import send_file

from .models import User
from .forms import ExampleForm

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename


# Admin mode accessed using "http://<url>/admin"
# Used to view database on website instead of app.db
admin.add_view(ModelView(User, db.session))


@app.route("/", methods=["POST","GET"])
def home():
        return render_template("home.html")
