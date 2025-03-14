#!/bin/bash

# Text formatting
NO_FORMAT="\033[0m"
F_BOLD="\033[1m"
C_CYAN1="\033[38;5;51m"
C_YELLOW="\033[38;5;11m"

# Set up Flask server
echo "Setting up Flask virtual environment..."
python3 -m venv flask

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source flask/Scripts/activate
else
    source flask/bin/activate
fi

# Install Flask dependancies
echo "Installing Flask dependencies..."
pip install -r src/requirements.txt

# Set up database
echo "Initializing and migrating database..."
cd src/server
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Go back to root directory
cd ../..

# Set up React client
echo "Setting up React client..."
cd src/client

echo "Installing React dependencies..."
npm install

# Go back to root directory
cd ../..

# Run Flask server
echo "Starting Flask server..."
echo ""
echo -e "${F_BOLD}${C_CYAN1}Setup complete! Flask running on http://localhost:5000${NO_FORMAT}"
echo -e "${F_BOLD}${C_CYAN1}To view the database: http://localhost:5000/admin${NO_FORMAT}"
echo -e "${F_BOLD}${C_YELLOW}Open React client (npm run dev) on another terminal.${NO_FORMAT}"

cd src/server
flask run 


