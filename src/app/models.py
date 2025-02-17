from app import db
from flask_login import UserMixin

# UserMixin passed to User table for login/authentication functionality
class User(UserMixin, db.Model):
    #Columns
    User_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    Username = db.Column(db.String(50), nullable=False)
    Password = db.Column(db.String(50), nullable=False)
    Email = db.Column(db.String(50), nullable=False)
    First_name = db.Column(db.String(50), nullable=False)
    Middle_name = db.Column(db.String(50), nullable=True)
    Surname = db.Column(db.String(50), nullable=False)
    DOB = db.Column(db.Date, nullable=False)
    Level_of_access = db.Column(db.Integer, nullable=False)
    Is_expert = db.Column(db.Boolean, nullable=False)
    
    #Relationships
    addresses = db.relationship('Address', backref='user', lazy=True)
    Payments = db.relationship('Payment', backref='user', lazy=True)
    Items = db.relationship('Items', foreign_keys='Items.Seller_id', backref='seller', lazy=True)
    Experts_review = db.relationship('Items', foreign_keys='Items.Expert_id', backref='expert', lazy=True)
    Wishlist = db.relationship('Wishlist', backref='user', lazy=True)
    Bidding_history = db.relationship('Bidding_history', backref='user', lazy=True)

class Address(db.Model):
    #Columns
    Address_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    User_id = db.Column(db.BigInteger, db.ForeignKey('user.User_id'), nullable=False)
    Line_1 = db.Column(db.String(50), nullable=False)
    Line_2 = db.Column(db.String(50), nullable=False)
    Country = db.Column(db.String(50), nullable=False)
    City = db.Column(db.String(50), nullable=False)
    Region = db.Column(db.String(50), nullable=False)
    Postcode = db.Column(db.String(50), nullable=False)
    Is_billing = db.Column(db.Boolean, nullable=False)

class Payment(db.Model):
    #Columns
    Payment_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    User_id = db.Column(db.BigInteger, db.ForeignKey('user.User_id'), nullable=False)
    Card_Number = db.Column(db.BigInteger, nullable=False)
    CVV = db.Column(db.Integer, nullable=False)
    Expiry = db.Column(db.Date, nullable=False)

class Items(db.Model):
    #Columns
    Item_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    Listing_name = db.Column(db.String(50), nullable=False)
    Seller_id = db.Column(db.BigInteger, db.ForeignKey('user.User_id'), nullable=False)
    Expert_id = db.Column(db.BigInteger, db.ForeignKey('user.User_id'), nullable=True)
    Verified = db.Column(db.Boolean, nullable=False)
    Upload_datetime = db.Column(db.DateTime, nullable=False)
    Min_price = db.Column(db.Float, nullable=False)
    Current_bid = db.Column(db.Float, nullable=False)
    Description = db.Column(db.String(500), nullable=False)

    #Relationships
    Images = db.relationship('Images', backref='item', lazy=True)
    Middle_type = db.relationship('Middle_type', backref='item', lazy=True)
    Wishlist = db.relationship('Wishlist', backref='item', lazy=True)
    Bidding_history = db.relationship('Bidding_history', backref='item', lazy=True)

class Images(db.Model):
    #Columns
    Image_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    Item_id = db.Column(db.BigInteger, db.ForeignKey('items.Item_id'), nullable=False)
    Image = db.Column(db.LargeBinary, nullable=False)
    Image_description = db.Column(db.String(100), nullable=False)

class Middle_type(db.Model):
    #Columns
    Middle_type_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    Item_id = db.Column(db.BigInteger, db.ForeignKey('items.Item_id'), nullable=False)
    Type_id = db.Column(db.BigInteger, db.ForeignKey('types.Type_id'), nullable=False)

class Types(db.Model):
    #Columns
    Type_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    Type_name = db.Column(db.String(50), nullable=False)

class Wishlist(db.Model):
    #Columns
    Wishlist_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    User_id = db.Column(db.BigInteger, db.ForeignKey('user.User_id'), nullable=False)
    Item_id = db.Column(db.BigInteger, db.ForeignKey('items.Item_id'), nullable=False)

class Bidding_history(db.Model):
    #Columns
    Bid_id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    Item_id = db.Column(db.BigInteger, db.ForeignKey('items.Item_id'), nullable=False)
    Bidder_id = db.Column(db.BigInteger, db.ForeignKey('user.User_id'), nullable=False)
    Successful_bid = db.Column(db.Boolean, nullable=False)
    Bid_datetime = db.Column(db.DateTime, nullable=False)
    Bid_price = db.Column(db.Float, nullable=False)

