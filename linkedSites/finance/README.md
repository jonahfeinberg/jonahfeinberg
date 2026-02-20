# C$50 Finance

This is a **Flask web application** — it requires a Python server to run. You cannot open the HTML files directly in a browser.

## How to Run Locally

### Mac / Linux
1. Make sure Python 3 and pip are installed.
2. In Terminal, navigate to this folder:
   ```
   cd path/to/finance
   ```
3. Run the start script:
   ```
   bash start.sh
   ```
4. Open your browser to: **http://127.0.0.1:5000**

### Windows
1. Make sure Python 3 and pip are installed.
2. Double-click **start.bat**
3. Open your browser to: **http://127.0.0.1:5000**

### Manual Start (any OS)
```bash
pip install cs50 Flask Flask-Session pytz requests
flask run
```

## Why Can't I Just Open the HTML Files?

The pages use Jinja2 templates (`{% %}`, `{{ }}`) that only Flask can interpret, and the stylesheet is served via `/static/styles.css` which requires a running server. Opening the files directly will show unstyled, broken pages.

## Deploying Online

To host this app publicly, deploy it to:
- [Render](https://render.com) (free tier available)
- [Railway](https://railway.app)
- [PythonAnywhere](https://www.pythonanywhere.com)

These platforms support Flask apps and will serve the static files correctly.
