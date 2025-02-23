import sys
import os
import pytest
import datetime
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db 
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import current_user
from app.models import User 

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            db.session.commit()
            
            yield client
            
            db.session.remove()
            db.drop_all()

def test_signup_valid(client):
    """
    Test signup with valid details 
    """

    # User signups up with valid details
    response = client.post("/api/signup", 
        json={
            "username": "testuser",
            "password": "PASSword123@",
            "email": "test@gmail.com",
            "first_name": "John",
            "middle_name": "Joe",
            "surname": "Doe",
            "DOB": "2000-01-01",
            "passwordConfirmation": "PASSword123@"
        },
        content_type='application/json'
    )
    
    server_response = json.loads(response.data)
    # Checks that the correct reponse code is returned
    assert response.status_code == 200
    
    # Check if the message in the response matches the expected message
    assert server_response["message"] == "User created successfully"
    
    # Check if the user is authenticated
    assert current_user.is_authenticated
    
    # Check if the data in the database matches the user input
    user = User.query.filter_by(Email="test@gmail.com").first()
    assert user is not None
    assert user.Username == "testuser"
    assert user.First_name == "John"
    assert user.Middle_name == "Joe"
    assert user.Surname == "Doe"
    assert user.DOB == datetime.date(2000, 1, 1)


def test_signup_existing_email(client):
    """
    Test signup with existing email
    """
    # Create a user
    test_user = User(
        Username="existinguser",
        Password=generate_password_hash("PASSword123@"),
        Email="test@gmail.com",
        First_name="John",
        Surname="Doe",
        DOB=datetime.date(1990, 1, 1),
        Level_of_access=1,
        Is_expert=False
    )
    db.session.add(test_user)
    db.session.commit()

    # User tries to make another account with the same email
    response = client.post("/api/signup", 
        json={
            "username": "newuser",
            "password": "PASSword123@",
            "email": "test@gmail.com",
            "first_name": "Jane",
            "middle_name": "Juniper",
            "surname": "Joe",
            "DOB": "2000-01-01",
            "passwordConfirmation": "PASSword123@"
        },
        content_type='application/json'
    )
    
    # Gets response from the server
    server_response = json.loads(response.data)
    
    # Checks if correct response code is returned
    assert response.status_code == 400
    
    # Checks if there is an error with the email
    assert "email" in server_response["errors"]
    
    # Check if the correct error message for email has been returned
    assert "Email already exists" in server_response["errors"]["email"]


def test_signup_existing_username(client):
    """
    Test signup with existing username
    """
    # Create a user
    test_user = User(
        Username="testuser",
        Password=generate_password_hash("PASSword123@"),
        Email="existing@gmail.com",
        First_name="John",
        Surname="Doe",
        DOB=datetime.date(1990, 1, 1),
        Level_of_access=1,
        Is_expert=False
    )
    db.session.add(test_user)
    db.session.commit()

    # User tries to create another account with the same username
    response = client.post("/api/signup", 
        json={
            "username": "testuser",
            "password": "PASSword123@",
            "email": "new@gmail.com",
            "first_name": "Jane",
            "middle_name": "Joe",
            "surname": "Doe",
            "DOB": "2000-01-01",
            "passwordConfirmation": "PASSword123@"
        },
        content_type='application/json'
    )
    
    # Gets response from the server
    server_response = json.loads(response.data)
    
    # Checks if correct response code is returned
    assert response.status_code == 400
    
    # Checks if there is an username error, and that the correct error message
    # has been returned
    assert "username" in server_response["errors"]
    assert "Username already exists" in server_response["errors"]["username"]
    
    
def test_signup_password_mismatch(client):
    """
    Test signup with mismatched passwords
    """
    
    response = client.post("/api/signup", 
        json={
            "username": "testuser",
            "password": "PASSword123@",
            "email": "test@gmail.com",
            "first_name": "John",
            "middle_name": "Joe",
            "surname": "Doe",
            "DOB": "2000-01-01",
            "passwordConfirmation": "DifferentPassword123@"
        },
        content_type='application/json'
    )
    
    # Gets response from the server
    server_response = json.loads(response.data)
    
    # Checks if correct response code is returned
    assert response.status_code == 400
    
    # Checks if there is a passwordConfirmation error, and that the correct error
    # message has been returned
    assert "passwordConfirmation" in server_response["errors"]
    assert "Passwords do not match" in server_response["errors"]["passwordConfirmation"]


