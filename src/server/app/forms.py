from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
import wtforms
from wtforms.validators import DataRequired, ValidationError
import re
import datetime


# Can create custom validation for fields in forms - i.e. password requirements
def CustomValidation():
    error_message = "msg"

    def _ValidateField(form, field):
        if field.data:
            # Implement Custom Validation
            raise ValidationError(error_message)
        
    return _ValidateField


# Example form (set of input fields, i.e. for logins, creating listings etc.)
class ExampleForm(FlaskForm):
    field1 = wtforms.StringField(validators=[DataRequired()])
    field2 = wtforms.StringField(validators=[DataRequired(), CustomValidation()])
    
    

def ValidateName():
    message = "Name contains invalid characters."

    def _ValidateFirstName(form, field):
        if field.data:
            #No numbers or punctuation in name
            if not re.match(r"^[A-Za-z\s]+$", field.data):
                raise ValidationError(message)
        
    return _ValidateFirstName


def ValidateEmailOrUsername():
    message = "Invalid Login Information."

    def _ValidateEmailOrUsername(form, field):
        if field.data:
            # Allow both email and username formats
            if not re.match(r"^[A-Za-z0-9@.+_-]+$", field.data):
                raise ValidationError(message)
        
    return _ValidateEmailOrUsername


def ValidateDateOfBirth():
    message = "Invalid Date of Birth."

    def _ValidateDateOfBirth(form, field):
        if field.data:
            if field.data >= datetime.date.today():
                raise ValidationError(message)
        
    return _ValidateDateOfBirth

def validate_description():
    message = "Invalid description."

    def _validate_description(form, field):
        if len(field.data) < 2:
            raise ValidationError(message)
    
    return _validate_description


def ValidatePassword():
    message = "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."

    def _ValidatePassword(form, field):
        password = field.data
        #Password to have atlest one uppercase letter, one lowercase letter, one number, and one special character
        #and be more than 7 characters long
        if (len(password) < 8 or
            not re.search(r'[A-Z]', password) or
            not re.search(r'[a-z]', password) or 
            not re.search(r'\d', password) or 
            not re.search(r'[!@#$%^&*(),.?":{}|<>]', password)): 
            raise ValidationError(message)
        
    return _ValidatePassword

def validate_price():
    message = "This is not a valid price."


    def _validate_price(form, field):
        # Validates if the price is greater than 0 and is to 2dp.
        price = float(field.data)
        if price < 0 or (not re.match(r"^\d+(\.\d{0,2})?$", str(field.data))):
            raise ValidationError(message)
        
    return _validate_price


    
class SignUpForm(FlaskForm):
    first_name = wtforms.StringField(validators=[DataRequired(), ValidateName()])
    middle_name = wtforms.StringField(validators=[ValidateName()])
    surname = wtforms.StringField(validators=[DataRequired(), ValidateName()])
    DOB = wtforms.DateField(format="%Y-%m-%d", validators=[DataRequired(), ValidateDateOfBirth()])
    username = wtforms.StringField(validators=[DataRequired()])
    email = wtforms.StringField(validators=[DataRequired()])
    password = wtforms.StringField(validators=[DataRequired(), ValidatePassword()])
    
    
class LoginForm(FlaskForm):
    email_or_username = wtforms.StringField(validators=[DataRequired(), ValidateEmailOrUsername()])
    password = wtforms.StringField(validators=[DataRequired()])

class Create_listing_form(FlaskForm):
    seller_id = wtforms.DecimalField(validators=[DataRequired()])
    listing_name = wtforms.StringField(validators=[DataRequired(), ValidateEmailOrUsername()])
    listing_description = wtforms.StringField(validators=[DataRequired(), validate_description()])
    minimum_price = wtforms.DecimalField(validators=[DataRequired(), validate_price()])
    images = FileField(validators=[DataRequired(), FileAllowed(['jpg', 'jpeg', 'png'], "Only images are allowed")])
    days_available = wtforms.DecimalField(validators=[DataRequired()])