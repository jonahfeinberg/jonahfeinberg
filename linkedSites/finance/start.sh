#!/bin/bash
# Start the C$50 Finance Flask app

echo "Installing dependencies..."
pip install cs50 Flask Flask-Session pytz requests 2>/dev/null || pip3 install cs50 Flask Flask-Session pytz requests

echo ""
echo "Starting C\$50 Finance at http://127.0.0.1:5000"
echo "Press Ctrl+C to stop."
echo ""

# Open browser after a short delay
(sleep 2 && open http://127.0.0.1:5000 2>/dev/null || xdg-open http://127.0.0.1:5000 2>/dev/null) &

cd "$(dirname "$0")"
flask run
