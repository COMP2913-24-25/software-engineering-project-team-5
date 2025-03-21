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
            
            # Create test items and bidding history
            test_item = Items(
                Listing_name="Vintage Watch",
                Seller_id=test_seller.User_id,
                Available_until=datetime.datetime.now() + datetime.timedelta(days=30),
                Verified=True,
                Authentication_request=False,
                Authentication_request_approved=True,
                Min_price=200,
                Current_bid=250,
            )
            db.session.add(test_item)
            db.session.commit()
            
            # Add bidding history
            bid = Bidding_history(
                Item_id=test_item.Item_id,
                Bidder_id=test_user.User_id,
                Bid_amount=300,
                Successful_bid=True,
                Winning_bid=True,
            )
            db.session.add(bid)
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

# Test Case for /api/get_bid_filtering
def test_get_bid_filtering(client, logged_in_user):
    test_item = Items.query.first()
    
    # Filter for 'won' bids
    data = {
        "bid_status": "won",
        "listing_Ids": [test_item.Item_id],
    }

    response = client.post("/api/get_bid_filtering", json=data)

    assert response.status_code == 200
    filtered_listing_ids = json.loads(response.data)
    assert len(filtered_listing_ids) > 0
    assert test_item.Item_id in filtered_listing_ids

def test_get_bid_filtering_no_results(client, logged_in_user):
    data = {
        "bid_status": "payment_failed",  # No successful bids with failed payment in this case
        "listing_Ids": [1],  # Assuming no such items
    }

    response = client.post("/api/get_bid_filtering", json=data)

    assert response.status_code == 200
    filtered_listing_ids = json.loads(response.data)
    assert len(filtered_listing_ids) == 0

def test_get_bid_filtering_expired(client, logged_in_user):
    # Add expired bid item
    expired_item = Items(
        Listing_name="Expired Watch",
        Seller_id=logged_in_user.User_id,
        Available_until=datetime.datetime.now() - datetime.timedelta(days=1),
        Verified=True,
        Authentication_request=False,
        Authentication_request_approved=True,
        Min_price=100,
        Current_bid=150,
    )
    db.session.add(expired_item)
    db.session.commit()

    # Check for expired bids
    data = {
        "bid_status": "expired",
        "listing_Ids": [expired_item.Item_id],
    }

    response = client.post("/api/get_bid_filtering", json=data)

    assert response.status_code == 200
    filtered_listing_ids = json.loads(response.data)
    assert len(filtered_listing_ids) > 0
    assert expired_item.Item_id in filtered_listing_ids
