from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
import wtforms
from wtforms.validators import DataRequired, ValidationError#


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