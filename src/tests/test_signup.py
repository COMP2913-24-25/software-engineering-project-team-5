import sys
import os
import pytest
import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db 
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import current_user, login_user
from app.models import User 
from flask import get_flashed_messages, request

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

def test_signup_page_loads(client):
    """
    Test that the signup page loads correctly
    """
    
    response = client.get("/signup")
    assert response.status_code == 200
    
def test_signup_valid(client):
    """
    Test login with valid details 
    """
    
    response = client.post("/signup", data={
        "username":"testuser",
        "password":"PASSword123@",
        "email":"test@gmail.com",
        "first_name":"John",
        "middle_name":"Joe",
        "surname":"Doe",
        "DOB":datetime.date(2000, 1, 1),
        "passwordConfirmation":"PASSword123@"
    }, follow_redirects=True)
    
    for key, value in request.form.items():
        print(f"{key}: {value}")
    
    assert response.status_code == 200
    assert current_user.is_authenticated
    
def test_signup_invalid_name(client):
    """
    Test login with invalid name
    """
    
    response = client.post("/signup", data={
        "username":"testuser",
        "password":generate_password_hash("PASSword123@"),
        "email":"test@gmail.com",
        "first_name":"John12",
        "middle_name":"Joe34@",
        "surname":"Doe56",
        "DOB":datetime.date(1990, 1, 1),
        "passwordConfirmation":generate_password_hash("PASSword123@")
    }, follow_redirects=True)
    
    for key, value in request.form.items():
        print(f"{key}: {value}")
    
    assert response.status_code == 200
    assert b"Name contains invalid characters." in response.data
    

def test_login_invalid_DOB(client):
    """
    Test login with invalid date of birth
    """
    
    response = client.post("/signup", data={
        "username":"testuser",
        "password":generate_password_hash("PASSword123@"),
        "email":"test@gmail.com",
        "first_name":"John",
        "middle_name":"Joe",
        "surname":"Doe",
        "DOB":datetime.date(3000, 1, 1),
        "passwordConfirmation":generate_password_hash("PASSword123@")
    }, follow_redirects=True)
    
    for key, value in request.form.items():
        print(f"{key}: {value}")
    
    assert response.status_code == 200
    assert b"Invalid Date of Birth." in response.data
    

def test_login_invalid_password(client):
    """
    Test login with invalid password
    """
    
    response = client.post("/signup", data={
        "username":"testuser",
        "password":"invalidpassword",
        "email":"test@gmail.com",
        "first_name":"John",
        "middle_name":"Joe",
        "surname":"Doe",
        "DOB":datetime.date(3000, 1, 1),
        "passwordConfirmation":"invalidpassword"
    }, follow_redirects=True)

    
    assert response.status_code == 200
    assert b"Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character." in response.data
    

    