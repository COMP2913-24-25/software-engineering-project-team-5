import sys
import os
import pytest
import json
import datetime
import base64

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from app.models import User, Items, Types, Middle_type, Images
from werkzeug.security import generate_password_hash
from flask import session

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
            
            # Create test items
            test_item = Items(
                Listing_name="Smartphone",
                Seller_id=test_seller.User_id,
                Upload_datetime=datetime.datetime.now(),
                Available_until=datetime.datetime.now() + datetime.timedelta(days=2),
                Min_price=700,
                Current_bid=750,
                Description="Latest Model Smartphone with 128GB Storage",
                Verified=True,
                Authentication_request=False,
                Authentication_request_approved = True
            )
            db.session.add(test_item)
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

def test_get_search_filter_no_query(client, logged_in_user):
    # item_check = db.session.query(Items).all()
    # print("Items in DB after commit:", item_check)  # Debugging

    response = client.post("/api/get_search_filter", json={"item": True, "user" : False, "searchQuery": ""})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) > 0  # Expecting at least one item

def test_get_search_filter_with_query(client, logged_in_user):
    response = client.post("/api/get_search_filter", json={"item": True, "searchQuery": "Smart"})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) > 0
    assert data[0]["Listing_name"] == "Smartphone"

def test_get_search_filter_no_results(client, logged_in_user):
    response = client.post("/api/get_search_filter", json={"item": True, "searchQuery": "NonExistentItem"})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 0

def test_get_search_filter_invalid_request(client, logged_in_user):
    response = client.post("/api/get_search_filter", json={"user": True, "item": False, "searchQuery": "John"})
    assert response.status_code == 200  # Should handle gracefully even if user search is not implemented
