import sys
import os
import pytest
import datetime
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from werkzeug.security import generate_password_hash
from flask import session
from app.models import User, Items


@pytest.fixture
def client():
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
                Is_expert=False,
            )

            # Populates the database with a test expert user
            test_expert = User(
                Username="testexpert",
                Password=generate_password_hash("PASSword123@"),
                Email="testexpert@gmail.com",
                First_name="Tahmid",
                Surname="Uddin",
                DOB=datetime.date(2005, 1, 28),
                Level_of_access=2,
                Is_expert=True,
            )

            db.session.add(test_user)
            db.session.add(test_expert)
            db.session.commit()

            yield client

            db.session.remove()
            db.drop_all()


@pytest.fixture
def logged_in_expert(client):
    """
    Logs in a test expert user
    """

    # Fixed: Use "testexpert" instead of "expertuser"
    test_expert = User.query.filter_by(Username="testexpert").first()

    # Calls login function to log the user in and set up session variables
    response = client.post(
        "/api/login",
        json={"email_or_username": test_expert.Email, "password": "PASSword123@"},
        content_type="application/json",
    )

    return test_expert


def test_get_experts_authentication_requests_success(client, logged_in_expert):
    """
    Test if correct pending and past authentication requests are retrieved for an expert
    """

    # Create test items assigned to the expert
    item1 = Items(
        Listing_name="Nike Shoes",
        Seller_id=1,
        Expert_id=logged_in_expert.User_id,
        Upload_datetime=datetime.datetime.now(datetime.timezone.utc),
        Available_until=datetime.datetime.now(datetime.timezone.utc),
        Min_price=100,
        Current_bid=10,
        Description="Cool Nike Shoes",
        Verified=False,
        Authentication_request=True,
    )

    item2 = Items(
        Listing_name="Vans Shoes",
        Seller_id=1,
        Expert_id=logged_in_expert.User_id,
        Upload_datetime=datetime.datetime.now(datetime.timezone.utc),
        Available_until=datetime.datetime.now(datetime.timezone.utc),
        Min_price=200,
        Current_bid=10,
        Description="Cool Vans Shoes",
        Verified=True,
        Authentication_request=False,
    )

    db.session.add_all([item1, item2])
    db.session.commit()

    seller = User.query.filter_by(User_id=item1.Seller_id).first()

    response = client.post("/api/get-experts-authentication-requests")
    server_response = json.loads(response.data)

    # Checks if successful status code returned
    assert response.status_code == 200

    # Checks if pending authentication request is returned
    assert len(server_response["pending_auth_requests"]) == 1
    pending_request = server_response["pending_auth_requests"][0]

    assert pending_request["Item_id"] == item1.Item_id
    assert pending_request["Listing_name"] == "Nike Shoes"
    assert pending_request["Seller_id"] == seller.User_id
    assert pending_request["Seller_name"] == seller.First_name + " " + seller.Surname
    assert pending_request["Min_price"] == 100
    assert pending_request["Description"] == "Cool Nike Shoes"
    assert pending_request["Verified"] is False

    # Checks if past authentication request is returned
    assert len(server_response["past_auth_requests"]) == 1
    past_request = server_response["past_auth_requests"][0]

    assert past_request["Item_id"] == item2.Item_id
    assert past_request["Listing_name"] == "Vans Shoes"
    assert past_request["Seller_id"] == seller.User_id
    assert past_request["Seller_name"] == seller.First_name + " " + seller.Surname
    assert past_request["Min_price"] == 200
    assert past_request["Description"] == "Cool Vans Shoes"
    assert past_request["Verified"] is True


def test_get_experts_authentication_requests_not_logged_in(client):
    """
    Test that authentication requests cannot be retrieved when no user is logged in
    """

    response = client.post("/api/get-experts-authentication-requests")
    server_response = json.loads(response.data)

    # Checks if unauthorized status code returned
    assert response.status_code == 401

    # Checks if the correct error message is returned
    assert server_response["message"] == "No user logged in"


def test_get_experts_authentication_requests_invalid_access(client):
    """
    Test that authentication requests cannot be retrieved by a non-expert user
    """
    user = User.query.filter_by(Username="testuser").first()

    client.post(
        "/api/login",
        json={"email_or_username": user.Email, "password": "PASSword123@"},
        content_type="application/json",
    )

    response = client.post("/api/get-experts-authentication-requests")
    server_response = json.loads(response.data)

    # Checks if unauthorized status code returned
    assert response.status_code == 401

    # Checks if the correct error message is returned
    assert server_response["message"] == "User has invalid access level"


def test_update_auth_request_accept_success(client, logged_in_expert):
    """
    Test if an expert can successfully accept an authentication request
    """

    # Create a test authentication request
    test_item = Items(
        Listing_name="Adidas Shoes",
        Seller_id=1,
        Expert_id=logged_in_expert.User_id,
        Upload_datetime=datetime.datetime.now(datetime.timezone.utc)
        - datetime.timedelta(days=5),
        Available_until=datetime.datetime.now(datetime.timezone.utc),
        Min_price=500,
        Current_bid=50,
        Description="Cool Adidas Shoes",
        Verified=False,
        Authentication_request=True,
    )
    db.session.add(test_item)
    db.session.commit()

    response = client.post(
        "/api/update_auth_request",
        json={"request_id": test_item.Item_id, "action": "accept"},
        content_type="application/json",
    )

    server_response = json.loads(response.data)

    # Checks if successful status code returned
    assert response.status_code == 200

    # Checks if the correct success message is returned
    assert server_response["message"] == "Successfully updated information"

    # Checks if database updates were applied correctly
    updated_item = Items.query.get(test_item.Item_id)
    assert updated_item.Verified == True
    assert updated_item.Authentication_request == False
    assert updated_item.Available_until > test_item.Upload_datetime


def test_update_auth_request_decline_success(client, logged_in_expert):
    """
    Test if an expert can successfully decline an authentication request
    """

    # Create a test authentication request
    test_item = Items(
        Listing_name="Adidas Shoes",
        Seller_id=1,
        Expert_id=logged_in_expert.User_id,
        Upload_datetime=datetime.datetime.now(datetime.timezone.utc)
        - datetime.timedelta(days=5),
        Available_until=datetime.datetime.now(datetime.timezone.utc),
        Min_price=500,
        Current_bid=50,
        Description="Cool Adidas Shoes",
        Verified=False,
        Authentication_request=True,
    )
    db.session.add(test_item)
    db.session.commit()

    response = client.post(
        "/api/update_auth_request",
        json={"request_id": test_item.Item_id, "action": "decline"},
        content_type="application/json",
    )

    server_response = json.loads(response.data)

    # Checks if successful status code returned
    assert response.status_code == 200

    # Checks if the correct success message is returned
    assert server_response["message"] == "Successfully updated information"

    # Checks if database updates were applied correctly
    updated_item = Items.query.get(test_item.Item_id)
    assert updated_item.Verified == False
    assert updated_item.Authentication_request == False


def test_update_auth_request_not_logged_in(client):
    """
    Test that an authentication request cannot be updated when no user is logged in
    """

    response = client.post(
        "/api/update_auth_request",
        json={"request_id": 1, "action": "accept"},
        content_type="application/json",
    )

    server_response = json.loads(response.data)

    # Checks if unauthorized status code returned
    assert response.status_code == 401

    # Checks if the correct error message is returned
    assert server_response["message"] == "No user logged in"


def test_update_auth_request_invalid_access(client):
    """
    Test that a non-expert user cannot update authentication requests
    """

    # Fixed: Use Username="testuser" instead of User_id=1
    user = User.query.filter_by(Username="testuser").first()

    # Fixed: Use the correct password "PASSword123@" instead of "UserPass123!"
    client.post(
        "/api/login",
        json={"email_or_username": user.Email, "password": "PASSword123@"},
        content_type="application/json",
    )

    response = client.post(
        "/api/update_auth_request",
        json={"request_id": 1, "action": "accept"},
        content_type="application/json",
    )

    server_response = json.loads(response.data)

    # Checks if unauthorized status code returned
    assert response.status_code == 401

    # Checks if the correct error message is returned
    assert server_response["message"] == "User has invalid access level"


def test_get_single_listing_success(client):
    """
    Test if the correct listing details are retrieved successfully
    """

    # Create test item
    test_item = Items(
        Listing_name="Puma Shoes",
        Seller_id=1,
        Upload_datetime=datetime.datetime.now(datetime.timezone.utc),
        Available_until=datetime.datetime.now(datetime.timezone.utc),
        Min_price=150,
        Current_bid=150,
        Description="Cool Puma Shoes",
        Authentication_request=False,
        Authentication_request_approved=True,
        Second_opinion=False,
        Verified=True,
    )
    db.session.add(test_item)
    db.session.commit()

    seller = User.query.filter_by(User_id=test_item.Seller_id).first()

    response = client.post(
        "/api/get-single-listing", json={"Item_id": test_item.Item_id}
    )
    server_response = json.loads(response.data)

    # Checks if successful status code returned
    assert response.status_code == 200

    # Checks if correct item details are returned
    assert server_response["Item_id"] == test_item.Item_id
    assert server_response["Listing_name"] == "Puma Shoes"
    assert server_response["Seller_id"] == seller.User_id
    assert server_response["Seller_name"] == seller.First_name + " " + seller.Surname
    assert server_response["Min_price"] == 150
    assert server_response["Description"] == "Cool Puma Shoes"
    assert server_response["Approved"] is True
    assert server_response["Second_opinion"] is False
    assert isinstance(server_response["Images"], list)


def test_get_single_listing_invalid_item(client):
    """
    Test that an error is returned when an invalid item ID is provided
    """

    response = client.post("/api/get-single-listing", json={"Item_id": 0})
    server_response = json.loads(response.data)

    # Checks if error status code returned
    assert response.status_code == 400
    assert server_response["Error"] == "Failed to retrieve items"


def test_request_second_opinion_success(client, logged_in_expert):
    """
    Test if an expert can successfully request a second opinion
    """

    # Create a test item assigned to the expert
    test_item = Items(
        Listing_name="Reebok Shoes",
        Seller_id=1,
        Expert_id=logged_in_expert.User_id,
        Upload_datetime=datetime.datetime.now(datetime.timezone.utc),
        Available_until=datetime.datetime.now(datetime.timezone.utc),
        Min_price=250,
        Current_bid=250,
        Description="Cool Reebok Shoes",
        Authentication_request=False,
        Authentication_request_approved=True,
        Second_opinion=False,
        Verified=True,
    )
    db.session.add(test_item)
    db.session.commit()

    response = client.post(
        "/api/request-second-opinion", json={"Item_id": test_item.Item_id}
    )
    server_response = json.loads(response.data)

    # Checks if successful status code returned
    assert response.status_code == 200
    assert server_response["message"] == "Details Updated Successfully"

    # Checks if database updates were applied correctly
    updated_item = Items.query.get(test_item.Item_id)
    assert updated_item.Second_opinion is True
    assert updated_item.Expert_id is None


def test_request_second_opinion_not_logged_in(client):
    """
    Test that a second opinion request cannot be made when no user is logged in
    """

    response = client.post("/api/request-second-opinion", json={"Item_id": 1})
    server_response = json.loads(response.data)

    # Checks if unauthorized status code returned
    assert response.status_code == 401
    assert server_response["message"] == "No user logged in"


def test_request_second_opinion_invalid_access(client):
    """
    Test that a non-expert user cannot request a second opinion
    """

    user = User.query.filter_by(Username="testuser").first()

    client.post(
        "/api/login",
        json={"email_or_username": user.Email, "password": "PASSword123@"},
        content_type="application/json",
    )

    response = client.post("/api/request-second-opinion", json={"Item_id": 1})
    server_response = json.loads(response.data)

    # Checks if unauthorized status code returned
    assert response.status_code == 401
    assert server_response["message"] == "Invalid Level of Access"
