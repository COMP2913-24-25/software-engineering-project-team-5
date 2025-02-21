WTF_CSRF_ENABLED = False
WTF_CSRF_CHECK_DEFAULT = False
WTF_CSRF_HEADERS = ['X-CSRF-TOKEN']
SECRET_KEY = 'a-very-secret-secret'

import os

basedir = os.path.abspath(os.path.dirname(__file__))
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
SQLALCHEMY_TRACK_MODIFICATIONS = True