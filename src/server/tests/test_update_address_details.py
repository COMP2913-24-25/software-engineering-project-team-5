import sys
import os
import pytest
import datetime
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from werkzeug.security import generate_password_hash, check_password_hash
from flask import session
from app.models import User, Address

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    
    with app.test_client() as client:
        with app.app_context():
            # Initializes the database
            db.create_all()
            
            # Populates the database with a test user
            test_user = User(
                Username="testuser",
                Password=generate_password_hash("PASSword123@"),
                Email="test@gmail.com",
                First_name="John",
                Middle_name="Joe",
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
    Create and log in a test user
    """
    
    test_user = User.query.filter_by(User_id=1).first()
    
    # Calls login function to login the user in and set up
    # session variables
    response = client.post("/api/login", 
        json={
            "email_or_username": test_user.Email,
            "password": "PASSword123@"
        },
        content_type='application/json'
    )
        
    return test_user


@pytest.fixture
def user_with_address(logged_in_user):
    """
    Create a test address for the logged-in user
    """
    
    address = Address(
        User_id=logged_in_user.User_id,
        Line_1="123 Cool Street",
        Line_2="Flat 69",
        City="London",
        Country="United Kingdom",
        Postcode="P05TC0D3",
        Region="West Yorkshire",
        Is_billing=True
    )
    db.session.add(address)
    db.session.commit()
    
    return address


def test_get_address_details_success(client, user_with_address):
    """
    Test if correct address details are returned
    """
    
    response = client.post("/api/get-address-details")
    server_response = json.loads(response.data)
    
    # Checks if successful status code returned
    assert response.status_code == 200
    
    # Checks if addresses returned
    assert "addresses" in server_response
    
    # Checks if exactly one address returned
    assert len(server_response["addresses"]) == 1
    
    # Checks if address details are correct
    address = server_response["addresses"][0]
    assert address["Line_1"] == "123 Cool Street"
    assert address["Line_2"] == "Flat 69"
    assert address["City"] == "London"
    assert address["Country"] == "United Kingdom"
    assert address["Postcode"] == "P05TC0D3"
    assert address["Region"] == "West Yorkshire"
    assert address["Is_billing"] is True


def test_get_address_details_no_addresses(client, logged_in_user):
    """
    Test for when user had no address details stored in the database
    """
    
    response = client.post("/api/get-address-details")
    server_response = json.loads(response.data)
    
    # Check if correct status code returned
    assert response.status_code == 400
    
    # Check if correct error message returned
    assert server_response["message"] == "No addresses found"


def test_get_address_details_not_logged_in(client):
    """
    Test that address details cannot be retrieved when not logged in
    """
    
    response = client.post("/api/get-address-details")
    server_response = json.loads(response.data)
    
    # Checks if unauthorized status code returned
    assert response.status_code == 401
    
    # Checks if correct error message was returned
    assert server_response["message"] == "No user logged in"


def test_update_address_create_new(client, logged_in_user):
    """
    Test creating a new address
    """
    
    response = client.post("/api/update-address", 
        json={
            "Address_id": "",
            "Line_1": "456 Cooler Street",
            "Line_2": "Flat 96",
            "City": "New York",
            "Country": "United States",
            "Postcode": "Z1PC0D3",
            "Region": "Ohio",
            "Is_billing": True
        },
        content_type='application/json'
    )
    server_response = json.loads(response.data)
    
    # Checks if correct status code returned
    assert response.status_code == 200
    
    # Checks if correct message returned
    assert server_response["message"] == "Address updated successfully"
    
    # Checks the address was created in the database
    address = Address.query.filter_by(User_id=logged_in_user.User_id).first()
    assert address is not None
    assert address.Line_1 == "456 Cooler Street"
    assert address.Line_2 == "Flat 96"
    assert address.City == "New York"
    assert address.Country == "United States"
    assert address.Postcode == "Z1PC0D3"
    assert address.Region == "Ohio"
    assert address.Is_billing is True


def test_update_address_existing(client, user_with_address):
    """
    Test updating an existing address
    """
    
    response = client.post("/api/update-address", 
        json={
            "Address_id": user_with_address.Address_id,
            "Line_1": "123 Cool Street",
            "Line_2": "Flat 70",
            "City": "London",
            "Country": "United Kingdom",
            "Postcode": "HD92JKP",
            "Region": "East Yorkshire",
            "Is_billing": True
        },
        content_type='application/json'
    )
    server_response = json.loads(response.data)
    
    # Checks if correct status code returned    
    assert response.status_code == 200

    # Checks if correct message returned
    assert server_response["message"] == "Address updated successfully"
    
    # Checks that the address was updated in the database
    updated_address = Address.query.filter_by(Address_id=user_with_address.Address_id).first()
    assert updated_address is not None
    assert updated_address.Line_1 == "123 Cool Street"
    assert updated_address.Line_2 == "Flat 70"
    assert updated_address.City == "London"
    assert updated_address.Country == "United Kingdom"
    assert updated_address.Postcode == "HD92JKP"
    assert updated_address.Region == "East Yorkshire"
    assert updated_address.Is_billing is True


def test_update_address_multiple_billing(client, logged_in_user):
    """
    Test that only one address can be set as billing address
    """
    # Create first address (billing)
    first_address = Address(
        User_id=logged_in_user.User_id,
        Line_1="asdf",
        Line_2="asdf",
        City="asdf",
        Country="asdf",
        Postcode="asdf",
        Region="asdf",
        Is_billing=True
    )
    db.session.add(first_address)
    db.session.commit()
    
    # Create second address (also set as billing)
    response = client.post("/api/update-address", 
        json={
            "Address_id": "",
            "Line_1": "qwer",
            "Line_2": "qwer",
            "City": "qwer",
            "Country": "qwer",
            "Postcode": "qwer",
            "Region": "qwer",
            "Is_billing": True
        },
        content_type='application/json'
    )
    
    assert response.status_code == 200
    
    # Checks that only the second address is a billing address
    first_address_updated = Address.query.filter_by(Address_id=first_address.Address_id).first()
    assert first_address_updated.Is_billing is False
    
    second_address = Address.query.filter_by(Line_1="qwer").first()
    assert second_address.Is_billing is True


def test_update_address_not_logged_in(client):
    """
    Test that address cannot be updated when not logged in
    """
    
    response = client.post("/api/update-address", 
        json={
            "Address_id": "asdf",
            "Line_1": "asdf",
            "Line_2": "asdf",
            "City": "asdf",
            "Country": "asdf",
            "Postcode": "asdf",
            "Region": "asdf",
            "Is_billing": False
        },
        content_type='application/json'
    )
    server_response = json.loads(response.data)
    
    # Checks if unauthorized status code returned
    assert response.status_code == 401
    
    # Checks if correct error message returned
    assert server_response["message"] == "No user logged in"


def test_delete_address_success(client, user_with_address):
    """
    Test successful deletion of an address
    """
    
    response = client.post("/api/delete-address", 
        json={"Address_id": user_with_address.Address_id},
        content_type='application/json'
    )
    server_response = json.loads(response.data)
    
    # Checks if correct status code returned
    assert response.status_code == 200
    
    # Checks if correct message returned
    assert server_response["message"] == "Address deleted successfully"
    
    # Verify the address was deleted from the database
    address = Address.query.filter_by(Address_id=user_with_address.Address_id).first()
    assert address is None


def test_delete_address_not_logged_in(client):
    """
    Test that address cannot be deleted when not logged in
    """
    
    response = client.post("/api/delete-address", 
        json={"Address_id": 1},
        content_type='application/json'
    )
    server_response = json.loads(response.data)
    
    # Checks if correct status code was returned
    assert response.status_code == 401
    
    # Checks if correct error message was returned
    assert server_response["message"] == "No user logged in"