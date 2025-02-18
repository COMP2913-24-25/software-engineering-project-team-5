import sys
import os
import pytest
import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db 
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import current_user, login_user
from app.models import User 

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
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

def test_login_page_loads(client):
    """
    Test that the login page loads correctly
    """
    
    response = client.get("/login")
    assert response.status_code == 200

def test_login_valid_email(client):
    """
    Test login with valid email
    """
    
    response = client.post("/login", data={
        "email_or_username": "test@gmail.com",
        "password": "PASSword123@"
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert current_user.is_authenticated


def test_login_valid_username(client):
    """
    Test login with valid username 
    """
    
    response = client.post("/login", data={
        "email_or_username": "testuser",
        "password": "PASSword123@"
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert current_user.is_authenticated

def test_login_invalid_password(client):
    """
    Test login with invalid password
    """
    
    response = client.post("/login", data={
        "email_or_username": "test@gmail.com",
        "password": "wrongpassword"
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b"Invalid email or password" in response.data

def test_login_invalid_user(client):
    """
    Test login with non-existent user
    """
    
    response = client.post("/login", data={
        "email_or_username": "nonexistent@example.com",
        "password": "password123"
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b"Invalid email or password" in response.data
    