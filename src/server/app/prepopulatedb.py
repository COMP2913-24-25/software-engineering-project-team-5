from app import app, db, 

from .models import (
    User,
    Address,
    Payment,
    Items,
    Images,
    Middle_type,
    Types,
    Watchlist,
    Bidding_history,
    Profit_structure,
    Availabilities,
)

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

import base64
import datetime


# Add functions to add default data to the database here
# Create a function like the one below, and then add a CLI command to run it
# in the app.cli.command block at the bottom of this file.
# Then in the setup.sh file, add the command to the list of commands to run.

# i.e. refering to line 31 in setup.sh

# 31. # Prepopulate database 
# 32. echo "Adding data to the database..."
# 33. flask add-users <- Line already there to add users 
# 34. flask <cli-command-name> <- Add a new line here to add new data to the database


def add_users():
    """
    Function to add default users to the database.
    """

    with app.app_context():
        # Basic User
        basic_user = User(
            First_name="Basic",
            Surname="User",
            DOB=date(2000, 1, 1),
            Username="user",
            Email="user@gmail.com",
            Password=generate_password_hash("P@ssw0rd123"),
            Level_of_access=1,
            Is_expert=False,
        )

        # Expert User
        expert_user = User(
            First_name="Expert",
            Surname="User",
            DOB=date(2000, 1, 1),
            Username="expert",
            Email="expert@gmail.com",
            Password=generate_password_hash("P@ssw0rd123"),
            Level_of_access=2,
            Is_expert=True,
        )

        # Manager User
        manager_user = User(
            First_name="Manager",
            Surname="User",
            DOB=date(2000, 1, 1),
            Username="manager",
            Email="manager@gmail.com",
            Password=generate_password_hash("P@ssw0rd123"),
            Level_of_access=3,
            Is_expert=False,
        )

        # Add users to the database
        db.session.add(basic_user)
        db.session.add(expert_user)
        db.session.add(manager_user)
        db.session.commit()

        print("Users added successfully!")


@app.cli.command("add-users")
def add_users_command():
    """
    CLI command to add default users to the database.
    """
    add_users()
