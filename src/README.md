# Flask Setup
## Directory Tree
```
src/ 
└── app/
    ├── static/
        └── CSS, JavaScript
    ├── templates/
        └── HTML for pages
    ├── __init__.py
    ├── forms.py
    ├── models.py
    ├── views.py
├── config.py
├── db_create.py
├── README.md
├── requirements.txt
├── run.py
```
**config.py, db_create.py, run.py** - shouldn't really need to change file contents (**init.py** may also fall into this category, as not sure if API support will require changes to this file) \
All shown above are required files - extra files/directories may be created for modularity

### Directory Tidiness Guidelines
When commiting new changes, **DO NOT** 
- push the **flask** directory which is created when initialising the flask virtual environment. 
- push any **pycache** files which are created when *flask run* command is called

## Basic Commands (for reference)
Creates flask virtual environment and activates it - run the commands in software root directory (i.e. same level as "src" dir). Depending on OS, the **Scripts** folder could be named something different.
```bash
python3 -m venv flask
source flask/Scripts/activate
```
To deactivate the environment:
```bash
source flask/Scripts/deactivate
```
To run the flask application:
```bash
cd src
flask run
```
To create database (will create migrations folder and app.db file, which is where the database can be viewed):
```bash
cd src
flask db init
flask db migrate -m "<comment>"
flask db upgrade
```
**init**: Initialises database (creates migration folder in src dir) \
**migrate**: "commits" changes to db\
**upgrade**: "pushes" changes to db\




## First Time Setup
After initializing the flask virtual environment, the required dependencies need to be installed. In the same directory where the "flask" dir is located (and by extention, the "src" directory) do:

```bash
pip install -r src/requirements.txt
```
requirements.txt contains all the libraries required for the project. As more libraries are added, to update the requirements.txt, do:
```bash
pip freeze -l > requirements.txt
```
Note: if the pip command doesn't work, try the command below to reinstall pip in the latest version.
```bash
python -m pip install --upgrade pip
```
If it still doesn't work try replace pip with:
```bash
flask/Scripts/pip
```

