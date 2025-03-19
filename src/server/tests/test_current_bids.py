import sys
import os
import pytest
import json
import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from flask import session
from app.models import User, Items, Bidding_history
from werkzeug.security import generate_password_hash


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
                Username="testseller",
                Password=generate_password_hash("SellerPass123@"),
                Email="seller@gmail.com",
                First_name="Jane",
                Surname="Doe",
                DOB=datetime.date(1990, 4, 5),
                Level_of_access=1,
                Is_expert=False,
            )

            db.session.add(test_user)
            db.session.add(test_seller)
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


def test_get_bids_not_logged_in(client):
    response = client.get("/api/get-bids")
    assert response.status_code == 401
    assert json.loads(response.data)["message"] == "No user logged in"


def test_get_bids_no_bids(client, logged_in_user):
    response = client.get("/api/get-bids")
    assert response.status_code == 400
    assert json.loads(response.data)["message"] == "No current bids"


def test_get_bids_success(client, logged_in_user):
    test_item = Items(
        Listing_name="Rolex Watch",
        Seller_id=2,
        Upload_datetime=datetime.datetime.now(),
        Available_until=datetime.datetime.now() + datetime.timedelta(days=7),
        Min_price=5000,
        Current_bid=5100,
        Description="Luxury Rolex Watch",
        Verified=True,
        Authentication_request=False,
    )
    db.session.add(test_item)
    db.session.commit()

    test_bid = Bidding_history(
        Item_id=test_item.Item_id,
        Bidder_id=logged_in_user.User_id,
        Successful_bid=False,
        Bid_datetime=datetime.datetime.now(),
        Bid_price=5200,
        Winning_bid=True,
    )
    db.session.add(test_bid)
    db.session.commit()

    response = client.get("/api/get-bids")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "bids" in data
    assert len(data["bids"]) == 1
    assert data["bids"][0]["Bid_price"] == 5200
    assert data["bids"][0]["Listing_name"] == "Rolex Watch"
