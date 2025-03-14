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

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "http://localhost:5173",
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

db = SQLAlchemy(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.session_protection = "strong"
login_manager.login_view = "/"
login_manager.init_app(app)

# Initialize SocketIO
from app.messaging import socketio

socketio.init_app(app, cors_allowed_origins="http://localhost:5173")


@app.route("/api/get-csrf-token", methods=["GET"])
def get_csrf_token():
    return jsonify({"csrf_token": generate_csrf()})


from app.models import User
from app import views, models


@login_manager.user_loader
def load_user(id):
    if id is None:
        return None
    try:
        user = User.query.get(int(id))
        return user
    except ValueError:
        return None
