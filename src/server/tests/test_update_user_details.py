import sys
import os
import pytest
import datetime
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from werkzeug.security import generate_password_hash, check_password_hash
from flask import session
from flask_login import current_user
from app.models import User, Address

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    
    with app.test_client() as client:
        with app.app_context():
            # Initializes database
            db.create_all()
            
            # Populates the database with a test User
            test_user = User(
                Username="testuser",
                Password=generate_password_hash("PASSword123@"),
                Email="test@gmail.com",
                First_name="John",
                Middle_name="Joe",
                Surname="Doe",
                DOB=datetime.date(1990, 1, 1),
                Level_of_access=1,
                Is_expert=False
            )
            db.session.add(test_user)
            db.session.commit()
            
            yield client
            
            db.session.remove()
            db.drop_all()


@pytest.fixture
def logged_in_user(client):
    """
    Logs in a test user
    """
    
    test_user = User.query.filter_by(User_id=1).first()
    
    # Calls login function to login the user in and set up
    # session variables
    response = client.post("/api/login", 
        json={
            "email_or_username": test_user.Email,
            "password": "PASSword123@"
        },
        content_type='application/json'
    )
        
    return test_user


def test_get_user_details_success(client, logged_in_user):
    """
    Test if correct user detials are returned
    """
    
    response = client.post("/api/get-user-details")
    server_response = json.loads(response.data)
    
    # Checks if successful status code returned
    assert response.status_code == 200
    
    # Checks if the correct user details are returned
    assert server_response["First_name"] == "John"
    assert server_response["Middle_name"] == "Joe"
    assert server_response["Surname"] == "Doe"
    assert server_response["DOB"] == "1990-01-01"
    assert server_response["Email"] == "test@gmail.com"
    assert server_response["Username"] == "testuser"
    assert server_response["is_expert"] is False


def test_get_user_details_not_logged_in(client):
    """
    Test that user details cannot be retrieved when not logged in
    """
    
    response = client.post("/api/get-user-details")
    server_response = json.loads(response.data)
    
    # Checks if unauthorized status code returned
    assert response.status_code == 401
    
    # Checks if the correct error message is returned
    assert server_response["message"] == "No user logged in"


def test_update_user_details_success(client, logged_in_user):
    """
    Test successful update of user details
    """
    
    response = client.post("/api/update-user-details", 
        json={
            "First_name": "Tahmid",
            "Middle_name": "Fahim",
            "Surname": "Uddin",
            "DOB": "2005-01-28"
        },
        content_type='application/json'
    )
    
    server_response = json.loads(response.data)
    
    # Checks if successful status code returned
    assert response.status_code == 200
    
    # Checks if the correct success message is returned
    assert server_response["message"] == "Details Updated Successfully"
    
    # Check if the database has been updated
    updated_user = User.query.filter_by(User_id=logged_in_user.User_id).first()
    assert updated_user.First_name == "Tahmid"
    assert updated_user.Middle_name == "Fahim"
    assert updated_user.Surname == "Uddin"
    assert updated_user.DOB == datetime.date(2005, 1, 28)


def test_update_user_details_not_logged_in(client):
    """
    Test that user details cannot be updated when not logged in
    """
    
    response = client.post("/api/update-user-details", 
        json={
            "First_name": "Jane",
            "Middle_name": "Julie",
            "Surname": "Smith",
            "DOB": "1995-05-05"
        },
        content_type='application/json'
    )
    server_response = json.loads(response.data)
    
    # Checks if unauthorized status code returned
    assert response.status_code == 401
    
    # Checks if correct error message was returned
    assert server_response["message"] == "No user logged in"


def test_update_user_details_invalid_data(client, logged_in_user):
    """
    Test update with invalid DOB
    """
    
    # Assuming the form validation requires non-empty First_name
    response = client.post("/api/update-user-details", 
        json={
            "First_name": "Tahmid",
            "Middle_name": "Fahim",
            "Surname": "Uddin",
            "DOB": "3005-01-28"
        },
        content_type='application/json'
    )
    server_response = json.loads(response.data)

    # Checks if correct status code returned
    assert response.status_code == 400
    
    # Check if DOB error occurred
    assert "errors" in server_response
    assert "DOB" in server_response["errors"]
    
    # Check if the correct error message was returned
    assert "Invalid Date of Birth." in server_response["errors"]["DOB"]
