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

@pytest.fixture
def logged_in_user(client):
    """
    Test login with valid details
    """
    new_user = User.query.filter_by(Username="testuser").first()
    # Creates a test response as a json object
    response = client.post("/api/login", 
        json={
            "email_or_username": "test@gmail.com",
            "password": "PASSword123@"
        },
        content_type='application/json'
    )
    
    return new_user


def test_create_customer_valid(client, logged_in_user):
    """
    Test create customer with valid details
    """
    response = client.post("/api/create-stripe-customer")
    
    # Gets data from the server
    server_response = json.loads(response.data)
    
    # Checks if the correct response code is returned
    assert response.status_code == 200
    
    # Checks if the correct response is returned and that the user is successfully logged in
    assert server_response["message"] == "Stripe customer created!"
    # Check if the data in the database matches the user input
    user = User.query.filter_by(Email="test@gmail.com").first()
    assert user is not None
    assert user.Customer_ID is not None
    assert user.Customer_ID.startswith('cus_')
    


def test_create_customer_not_logged_in(client):
    """
    Test customer not logged in
    """
    response = client.post("/api/create-stripe-customer")
    
    # Gets data from the server
    server_response = json.loads(response.data)
    
    # Checks if the correct response code is returned
    assert response.status_code == 401
    
    # Checks if the correct error is returned 
    assert server_response["message"] == "No user logged in, unable to create stripe customer"


