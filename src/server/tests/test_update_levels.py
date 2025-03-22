import sys
import os
import pytest
import json
import datetime
from werkzeug.security import generate_password_hash
from app import app, db
from app.models import User, Items

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Test Setup - Fixtures
@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            # Create test users
            test_user = User(
                Username="testuser",
                Password=generate_password_hash("UserPass123@"),
                Email="user@gmail.com",
                First_name="John",
                Surname="Doe",
                DOB=datetime.date(1995, 7, 10),
                Level_of_access=1,
                Is_expert=False,
            )
            
            test_seller = User(
                Username="seller",
                Password=generate_password_hash("SellerPass123@"),
                Email="seller@gmail.com",
                First_name="Jane",
                Surname="Smith",
                DOB=datetime.date(1988, 6, 15),
                Level_of_access=1,
                Is_expert=False,
            )
            
            db.session.add(test_user)
            db.session.add(test_seller)
            db.session.commit()

            yield client
            
            db.session.remove()
            db.drop_all()

@pytest.fixture
def logged_in_user(client):
    client.post(
        "/api/login",
        json={"email_or_username": "user@gmail.com", "password": "UserPass123@"},
        content_type="application/json",
    )
    return User.query.filter_by(Username="testuser").first()

# Test Case for /api/update_level
def test_update_level_success(client, logged_in_user):
    data = {
        "user_id": [logged_in_user.User_id],
        "level_of_access": ["2"],  # Setting user to expert
    }

    response = client.post("/api/update_level", json=data)

    assert response.status_code == 200
    message = json.loads(response.data)
    assert message["message"] == "Levels updated successfully"
    updated_user = User.query.filter_by(User_id=logged_in_user.User_id).first()
    assert updated_user.Level_of_access == 2
    assert updated_user.Is_expert == 1

def test_update_level_user_not_found(client, logged_in_user):
    data = {
        "user_id": [9999],  # Non-existent user_id
        "level_of_access": ["2"],
    }

    response = client.post("/api/update_level", json=data)

    assert response.status_code == 404
    error = json.loads(response.data)
    assert error["error"] == "User no found"

def test_update_level_invalid_data(client, logged_in_user):
    data = {
        "user_id": [logged_in_user.User_id],
        "level_of_access": ["invalid"],  # Invalid level of access
    }

    response = client.post("/api/update_level", json=data)

    assert response.status_code == 500
    error = json.loads(response.data)
    assert "error" in error
