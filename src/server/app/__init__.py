from flask import Flask, request, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_admin import Admin
from flask_babel import Babel
from flask_login import LoginManager
from flask_bootstrap import Bootstrap
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_cors import CORS
from flask_socketio import SocketIO
import stripe
from apscheduler.schedulers.background import BackgroundScheduler

stripe.api_key = "sk_test_51QvN8MIrwvA3VrIBU92sndiPG7ZWIgYImzVxVP2ofd1xEDLpwPgF4fgWNsWpVm46klGLfcfbjTvbec7Vfi11p9vk00ODQbcday"


def get_locale():
    if request.args.get("lang"):
        session["lang"] = request.args.get("lang")
    return session.get("lang", "en")


app = Flask(__name__)
app.config.from_object("config")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = True
app.config["REMEMBER_COOKIE_HTTPONLY"] = True
app.config["REMEMBER_COOKIE_SECURE"] = True

# Configure CORS
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://localhost:4173"],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "X-CSRF-TOKEN"],
            "expose_headers": ["Content-Type"],
        }
    },
)

Bootstrap(app)
csrf = CSRFProtect(app)
babel = Babel(app, locale_selector=get_locale)
admin = Admin(app, template_mode="bootstrap4")

# Initialize database
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Login manager setup
login_manager = LoginManager()
login_manager.session_protection = "strong"
login_manager.login_view = "/"
login_manager.init_app(app)

# Initialize SocketIO
socketio = SocketIO(maxHttpBufferSize=50 * 1024 * 1024)
socketio.init_app(
    app,
    cors_allowed_origins=["http://localhost:5173", "http://localhost:4173"],
    max_http_buffer_size=50 * 1024 * 1024,
)

# Initialize scheduler
scheduler = BackgroundScheduler()
app.scheduler = scheduler

with app.app_context():
    from . import models, views, taskqueue
    from .notifications import *
    from .messaging import *

    # Create database tables
    db.create_all()

    # Initialize task queue
    taskqueue.init_scheduler()


# CSRF Token creation
@app.route("/api/get-csrf-token", methods=["GET"])
def get_csrf_token():
    return jsonify({"csrf_token": generate_csrf()})


# User loader
@login_manager.user_loader
def load_user(id):
    if id is None:
        return None
    try:
        return models.User.query.get(int(id))
    except ValueError:
        return None


from .prepopulatedb import *


# Scheduler shuts down when app exits
@app.teardown_appcontext
def shutdown_scheduler(exception=None):
    if hasattr(app, "scheduler") and app.scheduler.running:
        app.scheduler.shutdown()
