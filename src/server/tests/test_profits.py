import pytest
import json
import datetime
from werkzeug.security import generate_password_hash
from app import app, db
from app.models import User, Profit_structure, Items


@pytest.fixture
def client():
    """Fixture for setting up the Flask test client."""
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()

            # Create a test user
            test_user = User(
                Username="testuser",
                Password=generate_password_hash("TestPass123@"),
                Email="testuser@gmail.com",
                First_name="John",
                Surname="Doe",
                DOB=datetime.date(1992, 7, 10),
                Level_of_access=3,  # Set appropriate access level
                Is_expert=False,
            )
            db.session.add(test_user)

            user = User(
                Username="user",
                Password=generate_password_hash("TestPass123@"),
                Email="user@gmail.com",
                First_name="John",
                Surname="Doe",
                DOB=datetime.date(1992, 7, 10),
                Level_of_access=1,  # Set appropriate access level
                Is_expert=False,
            )

            db.session.add(user)
            db.session.commit()

            # Create a test profit structure
            profit_structure = Profit_structure(
                Expert_split=0.5,
                Manager_split=0.5,
                Enforced_datetime=datetime.datetime.now(datetime.timezone.utc),
            )
            db.session.add(profit_structure)
            db.session.commit()

            # Create a test item
            test_item = Items(
                Listing_name="Test Item",
                Seller_id=test_user.User_id,
                Min_price=100,
                Current_bid=50,
                Available_until=datetime.datetime.now(datetime.timezone.utc)
                + datetime.timedelta(days=1),
                Description="Test",
                Verified=True,
                Authentication_request=False,
                Structure_id=profit_structure.Structure_id,
            )
            db.session.add(test_item)
            db.session.commit()

            yield client

            db.session.remove()
            db.drop_all()


@pytest.fixture
def logged_in_user(client):
    """Fixture to log in a user."""
    client.post(
        "/api/login",
        json={"email_or_username": "testuser@gmail.com", "password": "TestPass123@"},
        content_type="application/json",
    )
    return User.query.filter_by(Username="testuser").first()


def test_get_profit_structure(client, logged_in_user):
    """Test retrieving the most recent profit structure."""
    response = client.get(
        "/api/get-profit-structure", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "profit_data" in data
    assert data["profit_data"]["expert_split"] == 0.5
    assert data["profit_data"]["manager_split"] == 0.5


def test_get_profit_structure_no_record(client, logged_in_user):
    """Test when no profit structure exists in the database."""
    # Delete the existing profit structure
    Profit_structure.query.delete()
    db.session.commit()

    response = client.get(
        "/api/get-profit-structure", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "profit_data" in data
    assert data["profit_data"]["expert_split"] == 0.04
    assert data["profit_data"]["manager_split"] == 0.01


def test_update_profit_structure(client, logged_in_user):
    """Test updating the profit structure."""
    response = client.post(
        "/api/update-profit-structure",
        json={"managerSplit": 0.4, "expertSplit": 0.6},
        content_type="application/json",
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["message"] == "Profit structure updated successfully!"

    # Verify the updated structure in the database
    updated_structure = Profit_structure.query.order_by(
        Profit_structure.Enforced_datetime.desc()
    ).first()
    assert updated_structure.Expert_split == 0.6
    assert updated_structure.Manager_split == 0.4


def test_update_profit_structure_invalid(client, logged_in_user):
    """Test invalid profit structure update."""
    response = client.post(
        "/api/update-profit-structure",
        json={"managerSplit": 1.5, "expertSplit": 0.6},  # Invalid manager split
        content_type="application/json",
    )
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data["message"] == "Splits must be between 0 and 1."


def test_get_sold(client, logged_in_user):
    """Test retrieving all sold items."""
    response = client.get("/api/get-sold", headers={"Content-Type": "application/json"})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "sold_items" in data


def test_get_sold_no_items(client, logged_in_user):
    """Test when no sold items are found."""
    # Change the 'Available_until' to a future date so no items are sold
    Items.query.update(
        {
            Items.Available_until: datetime.datetime.now(datetime.timezone.utc)
            + datetime.timedelta(days=1)
        }
    )
    db.session.commit()

    response = client.get("/api/get-sold", headers={"Content-Type": "application/json"})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "sold_items" in data
    assert data["sold_items"] == []


@pytest.fixture
def logged_in_user2(client):
    """Fixture to log in a user."""
    client.post(
        "/api/login",
        json={"email_or_username": "user@gmail.com", "password": "TestPass123@"},
        content_type="application/json",
    )
    return User.query.filter_by(Username="user").first()


def test_get_sold_no_access(client):
    """Test when user does not have access level 3."""

    # Log in again after changing the user's access level
    client.post(
        "/api/login",
        json={"email_or_username": "user@gmail.com", "password": "TestPass123@"},
        content_type="application/json",
    )

    response = client.get("/api/get-sold", headers={"Content-Type": "application/json"})
    assert response.status_code == 401
    data = json.loads(response.data)
    assert data["message"] == "User is not on correct level of access!"
