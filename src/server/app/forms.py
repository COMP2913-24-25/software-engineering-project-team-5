from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
import wtforms
from wtforms.validators import DataRequired, ValidationError
import re
import datetime


# Can create custom validation for fields in forms - i.e. password requirements
def custom_validation():
    error_message = "msg"

    def _validate_field(form, field):
        if field.data:
            # Implement Custom Validation
            raise ValidationError(error_message)
        
    return _validate_field


# Example form (set of input fields, i.e. for logins, creating listings etc.)
class example_form(FlaskForm):
    field1 = wtforms.StringField(validators=[DataRequired()])
    field2 = wtforms.StringField(validators=[DataRequired(), custom_validation()])
    
    

def validate_name():
    message = "Name contains invalid characters."

    def _validate_name(form, field):
        if field.data:
            #No numbers or punctuation in name
            if not re.match(r"^[A-Za-z\s]+$", field.data):
                raise ValidationError(message)
        
    return _validate_name


def validate_email_or_username():
    message = "Invalid Login Information."

    def _validate_email_or_username(form, field):
        if field.data:
            # Allow both email and username formats
            if not re.match(r"^[A-Za-z0-9@.+_-]+$", field.data):
                raise ValidationError(message)
        
    return _validate_email_or_username


def validate_date_of_birth():
    message = "Invalid Date of Birth."

    def _validate_date_of_birth(form, field):
        if field.data:
            if field.data >= datetime.date.today():
                raise ValidationError(message)
        
    return _validate_date_of_birth


def validate_password():
    message = "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."

    def _validate_password(form, field):
        password = field.data
        #Password to have atlest one uppercase letter, one lowercase letter, one number, and one special character
        #and be more than 7 characters long
        if (len(password) < 8 or
            not re.search(r'[A-Z]', password) or
            not re.search(r'[a-z]', password) or 
            not re.search(r'\d', password) or 
            not re.search(r'[!@#$%^&*(),.?":{}|<>]', password)): 
            raise ValidationError(message)
        
    return _validate_password

    
class sign_up_form(FlaskForm):
    first_name = wtforms.StringField(validators=[DataRequired(), validate_name()])
    middle_name = wtforms.StringField(validators=[validate_name()])
    surname = wtforms.StringField(validators=[DataRequired(), validate_name()])
    DOB = wtforms.DateField(format="%Y-%m-%d", validators=[DataRequired(), validate_date_of_birth()])
    username = wtforms.StringField(validators=[DataRequired()])
    email = wtforms.StringField(validators=[DataRequired()])
    password = wtforms.StringField(validators=[DataRequired(), validate_password()])
    
    
class login_form(FlaskForm):
    email_or_username = wtforms.StringField(validators=[DataRequired(), validate_email_or_username()])
    password = wtforms.StringField(validators=[DataRequired()])