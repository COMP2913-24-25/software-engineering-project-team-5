import sys
import os
import pytest
import json
import datetime
from werkzeug.security import generate_password_hash
from app import app, db
from app.models import User, Items, Types, Middle_type, Images

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

            # Create test types and middle_type (for join)
            test_type = Types(Type_name="adidas blue shoes")
            db.session.add(test_type)
            db.session.commit()

            test_middle_type = Middle_type(Item_id=test_item.Item_id, Type_id=test_type.Type_id)
            db.session.add(test_middle_type)
            db.session.commit()


            yield client

            db.session.remove()
            db.drop_all()

# Test Case for /api/get_category_filters
def test_get_category_filters(client):
    data = {
        "categories": "adidas blue"  # Category should match the item type
    }

    response = client.post("/api/get_category_filters", json=data)

    assert response.status_code == 200
    filtered_items = json.loads(response.data)
    assert len(filtered_items) > 0  # We expect to get some items back
    assert any(item["Listing_name"] == "Vintage Watch" for item in filtered_items)


def test_get_category_filters_no_match(client):
    data = {
        "categories": "nike red"  # No items should match this category
    }

    response = client.post("/api/get_category_filters", json=data)

    assert response.status_code == 200
    filtered_items = json.loads(response.data)
    assert len(filtered_items) == 1  # No items should match


def test_get_category_filters_empty_category(client):
    data = {
        "categories": ""  # Empty category list, should return all items
    }

    response = client.post("/api/get_category_filters", json=data)

    assert response.status_code == 200
    filtered_items = json.loads(response.data)

    assert len(filtered_items) > 0  # We expect to get some items back


def test_get_category_filters_multiple_categories(client):
    data = {
        "categories": "adidas blue shoes, vintage"  # Multiple categories to filter on
    }

    response = client.post("/api/get_category_filters", json=data)

    assert response.status_code == 200
    filtered_items = json.loads(response.data)
    assert len(filtered_items) > 0  # We expect to get some items back
    assert any(item["Listing_name"] == "Vintage Watch" for item in filtered_items)
