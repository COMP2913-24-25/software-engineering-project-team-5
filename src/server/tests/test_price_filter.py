import sys
import os
import pytest
import json
import datetime
from werkzeug.security import generate_password_hash
from app import app, db
from app.models import User, Items, Bidding_history

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
            
            # Create test items
            test_item = Items(
                Listing_name="Vintage Watch",
                Seller_id=test_seller.User_id,
                Available_until=datetime.datetime.now() + datetime.timedelta(days=30),
                Verified=True,
                Authentication_request=False,
                Authentication_request_approved=True,
                Description="old watch",
                Min_price=200,
                Current_bid=250,
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

# Test Case for /api/get_filtered_listings
def test_get_filtered_listings(client, logged_in_user):
    test_item = Items.query.first()
    
    data = {
        "min_price": 100,
        "max_price": 300,
        "listing_Ids": [test_item.Item_id],
    }

    response = client.post("/api/get_filtered_listings", json=data)

    assert response.status_code == 200
    filtered_listing_ids = json.loads(response.data)
    assert len(filtered_listing_ids) > 0
    assert test_item.Item_id in filtered_listing_ids


def test_get_filtered_listings_no_match(client, logged_in_user):
    data = {
        "min_price": 500,
        "max_price": 1000,
        "listing_Ids": [1],  # Assuming no item with this price
    }

    response = client.post("/api/get_filtered_listings", json=data)

    assert response.status_code == 200
    filtered_listing_ids = json.loads(response.data)
    assert len(filtered_listing_ids) == 0
