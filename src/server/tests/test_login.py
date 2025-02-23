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
    """
    Creates flask client which can be used by the tests
    """
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


def test_login_valid_email(client):
    """
    Test login with valid email
    """
    
    # Creates a test response as a json object
    response = client.post("/api/login", 
        json={
            "email_or_username": "test@gmail.com",
            "password": "PASSword123@"
        },
        content_type='application/json'
    )
    
    # Gets data from the server
    server_response = json.loads(response.data)
    
    # Checks if the correct response code is returned
    assert response.status_code == 200
    
    # Checks if the correct response is returned and that the user is successfully logged in
    assert server_response["message"] == "Login successful"
    assert current_user.is_authenticated


def test_login_valid_username(client):
    """
    Test login with valid username 
    """
    response = client.post("/api/login", 
        json={
            "email_or_username": "testuser",
            "password": "PASSword123@"
        },
        content_type='application/json'
    )
    
    # Gets data from the server
    server_response = json.loads(response.data)
    
    # Checks if the correct response code is returned
    assert response.status_code == 200
    
    # Checks if the correct response is returned and that the user is successfully logged in
    assert server_response["message"] == "Login successful"
    assert current_user.is_authenticated


def test_login_invalid_password(client):
    """
    Test login with invalid password
    """
    response = client.post("/api/login", 
        json={
            "email_or_username": "test@gmail.com",
            "password": "wrongpassword"
        },
        content_type='application/json'
    )
    
    # Gets data from the server
    server_response = json.loads(response.data)
    
    # Checks if the correct response code is returned
    assert response.status_code == 400
    
    # Checks if there is a password error and that the correct error message is returned
    assert "password" in server_response["errors"]
    assert "Incorrect password" in server_response["errors"]["password"]
    
    # Checks that the user is not logged in
    assert not current_user.is_authenticated


def test_login_invalid_user(client):
    """
    Test login with non-existent user
    """
    response = client.post("/api/login", 
        json={
            "email_or_username": "nonexistent@example.com",
            "password": "password123"
        },
        content_type='application/json'
    )
    
    # Gets data from the server
    server_response = json.loads(response.data)
    
    # Checks if the correct response code is returned
    assert response.status_code == 400
    
    # Checks if there is an email or username error and that the correct error message is returned
    assert "email_or_username" in server_response["errors"]
    assert "User not found" in server_response["errors"]["email_or_username"]
    
    # Checks that the user is not logged in
    assert not current_user.is_authenticated