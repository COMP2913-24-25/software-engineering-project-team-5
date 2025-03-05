import sys
import os
import pytest
import json
import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, db
from flask import session
from app.models import User, Items
from werkzeug.security import generate_password_hash

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            # Create a test manager
            test_manager = User(
                Username="testmanager",
                Password=generate_password_hash("ManagerPass123@"),
                Email="manager@gmail.com",
                First_name="Alice",
                Surname="Smith",
                DOB=datetime.date(1985, 5, 20),
                Level_of_access=3,
                Is_expert=False
            )
            
            # Create a test expert
            test_expert = User(
                Username="testexpert",
                Password=generate_password_hash("ExpertPass123@"),
                Email="expert@gmail.com",
                First_name="Bob",
                Surname="Brown",
                DOB=datetime.date(1990, 3, 15),
                Level_of_access=2,
                Is_expert=True
            )
            
            db.session.add(test_manager)
            db.session.add(test_expert)
            db.session.commit()
            
            yield client
            
            db.session.remove()
            db.drop_all()

@pytest.fixture
def logged_in_manager(client):
    client.post("/api/login", 
        json={"email_or_username": "manager@gmail.com", "password": "ManagerPass123@"},
        content_type='application/json'
    )
    return User.query.filter_by(Username="testmanager").first()


def test_get_pending_auth_not_logged_in(client):
    response = client.get("/api/get-pending-auth")
    assert response.status_code == 401
    assert json.loads(response.data)["message"] == "No user logged in"


def test_get_pending_auth_invalid_access(client):
    client.post("/api/login", 
        json={"email_or_username": "expert@gmail.com", "password": "ExpertPass123@"},
        content_type='application/json'
    )
    
    response = client.get("/api/get-pending-auth")
    assert response.status_code == 401
    assert json.loads(response.data)["message"] == "User has invalid access level"


def test_get_expert_id_success(client, logged_in_manager):
    response = client.get("/api/get-expert-id")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "Available Experts" in data
    assert len(data["Available Experts"]) == 1
    assert data["Available Experts"][0]["Username"] == "testexpert"


def test_update_item_auth_success(client, logged_in_manager):
    test_item = Items(
        Listing_name="Gucci Bag",
        Seller_id=1,
        Expert_id=None,
        Upload_datetime=datetime.datetime.now(),
        Available_until=datetime.datetime.now(),
        Min_price=500,
        Current_bid=50,
        Description="Luxury Gucci Bag",
        Verified=False,
        Authentication_request=True
    )
    db.session.add(test_item)
    db.session.commit()
    
    expert = User.query.filter_by(Username="testexpert").first()
    response = client.post("/api/update_item_auth", 
        json={"item_id": test_item.Item_id, "expert_id": expert.User_id},
        content_type='application/json'
    )
    
    assert response.status_code == 200
    assert json.loads(response.data)["message"] == "Item successfully assigned to expert"
    
    updated_item = Items.query.get(test_item.Item_id)
    assert updated_item.Expert_id == expert.User_id


def test_update_item_auth_invalid_expert(client, logged_in_manager):
    response = client.post("/api/update_item_auth", 
        json={"item_id": 1, "expert_id": 9999},
        content_type='application/json'
    )
    
    assert response.status_code == 404
    assert json.loads(response.data)["message"] == "Item not found"


def test_update_item_auth_not_logged_in(client):
    response = client.post("/api/update_item_auth", 
        json={"item_id": 1, "expert_id": 2},
        content_type='application/json'
    )
    
    assert response.status_code == 401
    assert json.loads(response.data)["message"] == "No user logged in"
