import sys
import os
import pytest
import datetime
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from flask import session
from app.models import User, Watchlist, Items


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

            # Populates the database with a test user
            test_user = User(
                Username="testuser",
                Password="password",
                Email="test@gmail.com",
                First_name="John",
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
                Current_bid=50.0,
                Min_price=40.0,
                Available_until=datetime.datetime.utcnow() + datetime.timedelta(days=1),
                Seller_id=test_user.User_id,
                Verified=False,
                Authentication_request = False
            )
            db.session.add(test_item)
            db.session.commit()

            # Add item to watchlist
            test_watchlist = Watchlist(
                User_id=test_user.User_id,
                Item_id=test_item.Item_id
            )
            db.session.add(test_watchlist)
            db.session.commit()

            yield client

            db.session.remove()
            db.drop_all()


def test_get_watchlist_authenticated(client):
    """
    Test fetching watchlist when user is logged in
    """
    with client.session_transaction() as sess:
        sess["user_id"] = 1  # Simulate logged-in user

    response = client.get("/api/get-watchlist")

    server_response = json.loads(response.data)

    # Checks if the correct response code is returned
    assert response.status_code == 200

    # Ensure there is at least one item in the watchlist
    assert "watchlist" in server_response
    assert len(server_response["watchlist"]) > 0
    assert server_response["watchlist"][0]["Listing_name"] == "Test Item"


def test_get_watchlist_unauthenticated(client):
    """
    Test fetching watchlist when no user is logged in
    """
    response = client.get("/api/get-watchlist")
    server_response = json.loads(response.data)

    assert response.status_code == 401
    assert server_response["message"] == "No user logged in"


def test_remove_watchlist_authenticated(client):
    """
    Test removing an item from the watchlist when logged in
    """
    with client.session_transaction() as sess:
        sess["user_id"] = 1  # Simulate logged-in user

    response = client.post("/api/remove-watchlist",
        json={"item_id": 1},
        content_type="application/json"
    )

    server_response = json.loads(response.data)

    assert response.status_code == 200
    assert server_response["message"] == "Item removed from watchlist"


def test_remove_watchlist_unauthenticated(client):
    """
    Test removing an item from the watchlist when not logged in
    """
    response = client.post("/api/remove-watchlist",
        json={"item_id": 1},
        content_type="application/json"
    )

    server_response = json.loads(response.data)

    assert response.status_code == 401
    assert server_response["message"] == "No user logged in"


def test_remove_watchlist_non_existent_item(client):
    """
    Test removing an item that is not in the watchlist
    """
    with client.session_transaction() as sess:
        sess["user_id"] = 1  # Simulate logged-in user

    response = client.post("/api/remove-watchlist",
        json={"item_id": 999},  # Non-existent item
        content_type="application/json"
    )

    server_response = json.loads(response.data)

    assert response.status_code == 404
    assert server_response["message"] == "Item not found in watchlist"
