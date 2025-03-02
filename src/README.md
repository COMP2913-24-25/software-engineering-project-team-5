# Flask Setup

## Directory Tree

```
src/
├──client -> using React
    ├── node_modules
    ├── assets
    ├── src
        ├── components
            └── Reuseable UI components
        ├── pages
        ├── tests
            └── React test scripts
        ├── App.css
        ├── App.js
        ├── index.css
        ├── index.js
        ├── reportWebVitals.js
    ├── package.json -> react packages
    └── README.md
└──server -> using Flask
    └── app/
        ├── __init__.py
        ├── forms.py
        ├── models.py
        ├── views.py
    ├── config.py
    ├── db_create.py
    ├── README.md
    └── run.py
└──requirements.txt
```

**config.py, db_create.py, run.py** - shouldn't really need to change file contents (**init.py** may also fall into this category, as not sure if API support will require changes to this file) \
All shown above are required files - extra files/directories may be created for modularity

### Directory Tidiness Guidelines

When commiting new changes, **DO NOT**

-   push the **flask** directory which is created when initialising the flask virtual environment.
-   push any **pycache** files which are created when _flask run_ command is called

## First Time Setup

### Updated Setup Instructions

A script called **setup.sh** has been created to streamline the initial setup. Now all that needs to be done is:

```
bash setup.sh
```

This downloads all the related dependencies, creates the database and starts up the flask server. To run the client, open a new Git Bash terminal and:

```bash
cd src/client
npm run dev
```

To run tests, run the following:

```bash
cd src/client
npm run test
```

### Flask Setup

```bash
python3 -m venv flask
source flask/Scripts/activate
cd src/server
flask run
```

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

To create database (will create migrations folder and app.db file, which is where the database can be viewed):

```bash
cd src/server
flask db init
flask db migrate -m "<comment>"
flask db upgrade
```

**init**: Initialises database (creates migration folder in src dir) \
**migrate**: "commits" changes to db\
**upgrade**: "pushes" changes to db\

### React Setup

Need to install Node.js: https://nodejs.org/en

Also need to re install requirements.txt.

After initialising flask server, open a new git bash terminal. In the new terminal we will be running our React front end (assuming current dir is root directory):

```bash
cd src
cd client
npm install
npm run dev
```

You only need to run npm install when setting up for the first time, or if there are any changes to package.json.

Below is the command for running React client normally:

```bash
current dir: src/client
npm run dev
```

You may get warnings when doing these installs. If there is a critial warning, then do:

```bash
npm audit fix --force
```

If you get warning that aren't critical, its fine to ignore them, and you can start the client with npm start as before. You can delete the nodes_module folder if you are getting issues and redo the install.

## Additional Comments - IMPORTANT

Read the App.js, login.jsx and views.py files to understand how react is being used with flask.

CSRF Protection not enabled - things break when it is on, haven't figured out a fix.

Further React information on the README in the client directory.

In **package.json**, we have specified the proxy to be http://localhost:5000, to connect the front end to the Flask backend, but this will have to be changed once we deploy application (maybe lol, we will see after figuring out server hosting).

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
cd src/server
flask run
```
