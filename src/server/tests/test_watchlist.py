import sys
import os
import pytest
import json
import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from app.models import User, Items, Watchlist
from werkzeug.security import generate_password_hash
from flask import session

# Test Client Fixture
@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()

            # Create a test user
            test_user = User(
                Username="testuser",
                Password=generate_password_hash("TestPass123@"),
                Email="testuser@gmail.com",
                First_name="John",
                Surname="Doe",
                DOB=datetime.date(1992, 7, 10),
                Level_of_access=1,
                Is_expert=False,
            )

            db.session.add(test_user)
            db.session.commit()

            yield client

            db.session.remove()
            db.drop_all()

# Logged-in User Fixture
@pytest.fixture
def logged_in_user(client):
    client.post(
        "/api/login",
        json={"email_or_username": "testuser@gmail.com", "password": "TestPass123@"},
        content_type="application/json",
    )
    return User.query.filter_by(Username="testuser").first()

# Test Item Fixture
@pytest.fixture
def test_item(logged_in_user):
    # Create a test item for testing purposes
    item = Items(
        Listing_name="Test Item",
        Seller_id=logged_in_user.User_id,
        Min_price=100,
        Current_bid=50,
        Available_until=datetime.datetime.now() + datetime.timedelta(days=1),
        Description="Test",
        Verified=True,
        Authentication_request=False
    )
    db.session.add(item)
    db.session.commit()
    return item

def test_get_watchlist_not_logged_in(client):
    response = client.get("/api/get-watchlist")
    assert response.status_code == 401
    assert json.loads(response.data)["message"] == "No user logged in"

def test_get_watchlist_empty(client, logged_in_user):
    response = client.get("/api/get-watchlist")
    assert response.status_code == 200
    assert json.loads(response.data)["message"] == "No items in watchlist"

def test_add_watchlist_success(client, logged_in_user, test_item):
    response = client.post(
        "/api/add-watchlist", 
        json={"item_id": test_item.Item_id}, 
        content_type="application/json"
    )
    assert response.status_code == 200
    assert json.loads(response.data)["message"] == "Item added to watchlist"

def test_add_watchlist_already_exists(client, logged_in_user, test_item):
    # Add item to watchlist first
    client.post(
        "/api/add-watchlist", 
        json={"item_id": test_item.Item_id}, 
        content_type="application/json"
    )
    
    # Now try to add the same item again
    response = client.post(
        "/api/add-watchlist", 
        json={"item_id": test_item.Item_id}, 
        content_type="application/json"
    )
    assert response.status_code == 405  # Changed to 409 Conflict
    assert json.loads(response.data)["message"] == "Item already in watchlist"

def test_remove_watchlist_success(client, logged_in_user, test_item):
    # First add item to watchlist
    client.post(
        "/api/add-watchlist", 
        json={"item_id": test_item.Item_id}, 
        content_type="application/json"
    )
    
    # Now test removing it from the watchlist
    response = client.post(
        "/api/remove-watchlist", 
        json={"item_id": test_item.Item_id}, 
        content_type="application/json"
    )
    assert response.status_code == 200
    assert json.loads(response.data)["message"] == "Item removed from watchlist"

def test_remove_watchlist_not_found(client, logged_in_user):
    response = client.post(
        "/api/remove-watchlist", 
        json={"item_id": 9999}, 
        content_type="application/json"
    )
    assert response.status_code == 404
    assert json.loads(response.data)["message"] == "Item not found in watchlist"

def test_check_watchlist(client, logged_in_user, test_item):
    # Add item to watchlist first
    client.post(
        "/api/add-watchlist", 
        json={"item_id": test_item.Item_id}, 
        content_type="application/json"
    )
    
    response = client.get(f"/api/check-watchlist?Item_id={test_item.Item_id}")
    assert response.status_code == 200
    assert json.loads(response.data)["in_watchlist"] is True

def test_check_watchlist_not_found(client, logged_in_user):
    response = client.get("/api/check-watchlist?Item_id=9999")
    assert response.status_code == 200
    assert json.loads(response.data)["in_watchlist"] is False
