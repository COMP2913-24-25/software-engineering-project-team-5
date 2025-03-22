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
            
            db.session.add(test_user)
            db.session.commit()

            test_user_2 = User(
                Username="testuser2",
                Password=generate_password_hash("UserPass456@"),
                Email="user2@gmail.com",
                First_name="Jane",
                Surname="Smith",
                DOB=datetime.date(1996, 5, 15),
                Level_of_access=1,
                Is_expert=False,
            )
            db.session.add(test_user_2)
            db.session.commit()

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

            db.session.add(test_seller)
            db.session.commit()
            # Commit the changes to the database

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
def test_get_bid_filtering_won(client, logged_in_user):
    test_item = Items(
                    Listing_name="Rolex Watch",
                    Seller_id=3,
                    Upload_datetime=datetime.datetime.now() - datetime.timedelta(days=4),
                    Available_until=datetime.datetime.now() - datetime.timedelta(days=1),
                    Min_price=5000,
                    Current_bid=5100,
                    Description="Luxury Rolex Watch",
                    Verified=True,
                    Authentication_request=False,
                )
    db.session.add(test_item)
    db.session.commit()

    test_bid = Bidding_history( #test for bid won
                Item_id=test_item.Item_id,
                Bidder_id=1,  
                Successful_bid= True,
                Bid_datetime=datetime.datetime.now() - datetime.timedelta(days=3),
                Bid_price=5100,
                Winning_bid=True,
            )
    db.session.add(test_bid)
    db.session.commit()

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

def test_get_bid_filtering_out_bid(client, logged_in_user):
    
    test_item_3 = Items(
                Listing_name="Smartphone",
                Seller_id=3,
                Upload_datetime=datetime.datetime.now(),
                Available_until=datetime.datetime.now() + datetime.timedelta(days=2),
                Min_price=700,
                Current_bid=750,
                Description="Latest Model Smartphone with 128GB Storage",
                Verified=True,
                Authentication_request=False,
            )
    db.session.add(test_item_3)
    db.session.commit()

    test_bid_3 = Bidding_history(
                Item_id=test_item_3.Item_id,
                Bidder_id=1,
                Successful_bid=False,
                Bid_datetime=datetime.datetime.now() - datetime.timedelta(days=1),
                Bid_price=720,
                Winning_bid=False,
            )
    db.session.add(test_bid_3)
    db.session.commit()

    # Filter for 'won' bids
    data = {
        "bid_status": "out_bid",
        "listing_Ids": [test_item_3.Item_id],
    }

    response = client.post("/api/get_bid_filtering", json=data)

    assert response.status_code == 200
    filtered_listing_ids = json.loads(response.data)
    assert len(filtered_listing_ids) > 0
    assert test_item_3.Item_id in filtered_listing_ids
    
    
def test_get_bid_filtering_payment_failed(client, logged_in_user):
    test_item_2 = Items(
                    Listing_name="Vintage Guitar",
                    Seller_id=3,
                    Upload_datetime=datetime.datetime.now() - datetime.timedelta(days=4),
                    Available_until=datetime.datetime.now() - datetime.timedelta(days=1),
                    Min_price=1500,
                    Current_bid=1600,
                    Description="Vintage 1960's Fender Stratocaster Guitar",
                    Verified=True,
                    Authentication_request=False,
                )
    db.session.add(test_item_2)
    db.session.commit()

        
    test_bid_2 = Bidding_history( #test for payment failed
                Item_id=test_item_2.Item_id,
                Bidder_id=1,
                Successful_bid=True,
                Bid_datetime=datetime.datetime.now() - datetime.timedelta(days=2),
                Bid_price=1600,
                Winning_bid=False,
            )
    db.session.add(test_bid_2)
    db.session.commit()

    # Filter for 'out_bid' bids
    data = {
        "bid_status": "payment_failed",
        "listing_Ids": [test_item_2.Item_id],
    }

    response = client.post("/api/get_bid_filtering", json=data)

    assert response.status_code == 200
    filtered_listing_ids = json.loads(response.data)
    assert len(filtered_listing_ids) > 0
    assert test_item_2.Item_id in filtered_listing_ids

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
        Seller_id=logged_in_user.User_id,  # Now logged_in_user is available here
        Upload_datetime=datetime.datetime.now() - datetime.timedelta(days=4),
        Available_until=datetime.datetime.now() - datetime.timedelta(days=1),
        Verified=True,
        Authentication_request=False,
        Authentication_request_approved=True,
        Min_price=100,
        Current_bid=150,
        Description="Old luxury watch that has expired",
    )
    db.session.add(expired_item)
    db.session.commit()
    
    expired_bid = Bidding_history(
        Item_id=expired_item.Item_id,
        Bidder_id=logged_in_user.User_id,  # Just use the logged in user as bidder for the test
        Successful_bid=True,
        Bid_datetime=datetime.datetime.now() - datetime.timedelta(days=2),
        Bid_price=120,
        Winning_bid=True,
    )
    db.session.add(expired_bid)
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
