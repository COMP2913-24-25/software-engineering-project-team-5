import sys
import os
import pytest
import datetime
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from flask import session
from app.models import User, Items, Bidding_history


@pytest.fixture
def client():
    """
    Creates a Flask test client and sets up a test database.
    """
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()

            # Create test user
            test_user = User(
                Username="testuser",
                Password="password",
                Email="test@gmail.com",
                First_name="Jon",
                Surname="Doe",
                DOB=datetime.date(1990, 1, 1),
                Level_of_access=1,
                Is_expert=False
            )
            db.session.add(test_user)
            db.session.commit()

            # Create test item
            test_item = Items(
                Item_id=1,
                Listing_name="Test Item",
                Description="A test item description",
                Current_bid=55.0,
                Min_price=40.0,
                Available_until=datetime.datetime.utcnow(),
                Seller_id=test_user.User_id,
                Verified=False,
                Authentication_request=False
            )
            db.session.add(test_item)
            db.session.commit()

            # Create test bid
            test_bid = Bidding_history(
                Bid_id=1,
                Bidder_id=test_user.User_id,
                Item_id=test_item.Item_id,
                Bid_price=55.0,
                Bid_datetime=datetime.datetime.utcnow() + datetime.timedelta(days=1),
                Successful_bid=False
            )
            db.session.add(test_bid)
            db.session.commit()

            yield client

            db.session.remove()
            db.drop_all()


def test_get_history_authenticated(client):
    """
    Test fetching the bidding history when the user is logged in.
    """
    with client.session_transaction() as sess:
        sess["user_id"] = 1  # Simulate logged-in user

    response = client.get("/api/get-history")
    server_response = json.loads(response.data)

    assert response.status_code == 200


def test_get_history_unauthenticated(client):
    """
    Test fetching the bidding history when no user is logged in.
    """
    response = client.get("/api/get-history")
    server_response = json.loads(response.data)

    assert response.status_code == 401
    assert server_response["message"] == "No user logged in"


def test_get_history_no_bids(client):
    """
    Test fetching bidding history when there are no bids for the user.
    """
    with client.session_transaction() as sess:
        sess["user_id"] = 1  # Simulate logged-in user

    # Remove all bids from database
    Bidding_history.query.delete()
    db.session.commit()

    response = client.get("/api/get-history")
    server_response = json.loads(response.data)

    assert response.status_code == 400
    assert server_response["message"] == "No expired bids"


def test_get_history_with_bids(client):
    """
    Test fetching the bidding history when there are bids for the user.
    """
    with client.session_transaction() as sess:
        sess["user_id"] = 1  # Simulate logged-in user

    # Ensure there is at least one bid in the database
    test_user = User.query.get(1)
    test_item = Items.query.first()

    test_bid = Bidding_history(
        Bid_id=2,
        Bidder_id=test_user.User_id,
        Item_id=test_item.Item_id,
        Bid_price=60.0,
        Bid_datetime=datetime.datetime.utcnow(),
        Successful_bid=False
    )
    db.session.add(test_bid)
    db.session.commit()

    response = client.get("/api/get-history")
    server_response = json.loads(response.data)

    assert response.status_code == 200


def test_get_history_with_no_successful_bids(client):
    """
    Test fetching bidding history when there are no successful bids for the user.
    """
    with client.session_transaction() as sess:
        sess["user_id"] = 1  # Simulate logged-in user

    # Remove all successful bids and add an unsuccessful bid
    Bidding_history.query.delete()
    db.session.commit()

    test_user = User.query.get(1)
    test_item = Items.query.first()

    test_unsuccessful_bid = Bidding_history(
        Bid_id=3,
        Bidder_id=test_user.User_id,
        Item_id=test_item.Item_id,
        Bid_price=45.0,
        Bid_datetime=datetime.datetime.utcnow(),
        Successful_bid=False
    )
    db.session.add(test_unsuccessful_bid)
    db.session.commit()

    response = client.get("/api/get-history")
    server_response = json.loads(response.data)

    assert response.status_code == 200

