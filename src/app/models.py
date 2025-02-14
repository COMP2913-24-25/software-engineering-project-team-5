from app import db
from flask_login import UserMixin

# Example association table to fix many to many relationships
association_table_template = db.Table(
    "table_name",
    db.Model.metadata,
    db.Column("id", db.ForeignKey("user.id")),
    db.Column("id2", db.ForeignKey("temp.id")),
)

# UserMixin passed to User table for login/authentication functionality
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    
    
class Temp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # Foreign key declaration
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)

    string = db.Column(db.String(50), nullable=False)

    # db.relationship(...) used to create relationships between tables

