@echo off
echo Installing dependencies...
pip install cs50 Flask Flask-Session pytz requests

echo.
echo Starting C$50 Finance at http://127.0.0.1:5000
echo Press Ctrl+C to stop.
echo.

cd /d "%~dp0"
start "" http://127.0.0.1:5000
flask run
pause
