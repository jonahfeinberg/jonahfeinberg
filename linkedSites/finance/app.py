import os

from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, lookup, usd

# Configure application
app = Flask(__name__)

# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///finance.db")


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@login_required
def index():
    """Show portfolio of stocks"""

    rows = db.execute("""
        SELECT symbol,
               SUM(number_of_shares) AS shares
        FROM transactions
        WHERE user_id = ?
        GROUP BY symbol
        HAVING shares > 0
    """, session["user_id"])

    cash = db.execute(
        "SELECT cash FROM users WHERE id = ?",
        session["user_id"]
    )[0]["cash"]

    portfolio = []
    total_stocks = 0

    for row in rows:
        symbol = row["symbol"]
        shares_owned = row["shares"]

        stock = lookup(symbol)
        if stock is None:
            continue

        current_price = stock["price"]
        current_value = shares_owned * current_price
        total_stocks += current_value

        # 🔥 Calculate total buys (ignore sells)
        buy_data = db.execute("""
            SELECT SUM(number_of_shares) AS total_bought,
                   SUM(number_of_shares * price_per_share) AS total_spent
            FROM transactions
            WHERE user_id = ?
              AND symbol = ?
              AND number_of_shares > 0
        """, session["user_id"], symbol)

        total_bought = buy_data[0]["total_bought"]
        total_spent = buy_data[0]["total_spent"]

        if total_bought and total_spent:
            avg_price = total_spent / total_bought
            cost_basis = avg_price * shares_owned
        else:
            cost_basis = 0

        portfolio.append({
            "symbol": symbol,
            "shares": shares_owned,
            "cost_basis": cost_basis,   # 💰 this is what you want
            "price": current_price,
            "total": current_value
        })

    total_value = cash + total_stocks

    return render_template(
        "index.html",
        portfolio=portfolio,
        total_stocks=total_stocks,
        total=total_value,
        cash=cash
    )

@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    """Buy shares of stock"""

    if request.method == "GET":
        return render_template("buy.html")

    symbol = request.form.get("symbol")
    shares = request.form.get("shares")

    if not symbol:
        flash("Must provide valid symbol")
        return redirect("/")

    try:
        shares = int(shares)
        if shares <= 0:
            raise ValueError
    except:
        flash("Shares must be a valid integer")
        return redirect("/buy")

    stock = lookup(symbol)
    if stock is None:
        flash("Must provide valid symbol")
        return redirect("/buy")

    user = db.execute("SELECT cash FROM users WHERE id = ?", session["user_id"])

    cash = user[0]["cash"]
    cost = stock["price"]
    total_cost = shares * cost

    if total_cost > cash:
        flash("Cannot afford")
        return redirect("/buy")

    db.execute("UPDATE users SET cash = cash - ? WHERE id = ?", total_cost, session["user_id"])

    db.execute("INSERT INTO transactions (user_id, symbol, number_of_shares, price_per_share) VALUES (?, ?, ?, ?)", session["user_id"], symbol, shares, cost)

    flash(f"You bought {shares} shares of {stock['symbol']}")
    return redirect("/buy")


@app.route("/history")
@login_required
def history():
    """Show history of transactions"""

    transactions = db.execute(
        """
        SELECT symbol,
               number_of_shares,
               price_per_share,
               timestamp
        FROM transactions
        WHERE user_id = ?
        ORDER BY timestamp DESC
        """,
        session["user_id"]
    )

    return render_template("history.html", transactions=transactions)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            flash("Must provide valid username")
            return redirect("/login")

        # Ensure password was submitted
        elif not request.form.get("password"):
            flash("Must provide valid password")
            return redirect("/login")

        # Query database for username
        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            flash("Invalid username/password")
            return redirect("/login")

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/quote", methods=["GET", "POST"])
@login_required
def quote():
    if request.method == "POST":
        symbol = request.form.get("symbol")

        if not symbol:
            flash("No symbol given")
            return redirect("/quote")

        stock = lookup(symbol)
        if not stock:
            flash("Invalid symbol")
            return redirect("/quote")

        return render_template("quote.html", stock=stock)

    return render_template("quote.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")

        if not username:
            flash("Must provide valid username")
            return redirect("/register")
        if not password:
            flash("Must provide valid password")
            return redirect("/register")

        if len(password) < 8:
            flash("Password must be at least 8 characters long")
            return redirect("/register")

        rows = db.execute(
            "SELECT * FROM users WHERE username = ?",
            username
        )

        if confirmation != password:
            flash("Passwords do not match")
            return redirect("/register")

        if len(rows) != 0:
            flash("Username already exists")
            return redirect("/register")

        db.execute("INSERT INTO users (username, hash) VALUES (?, ?)", username, generate_password_hash(password))

        # login
        user_id = db.execute("SELECT id FROM users WHERE username = ?", username)[0]["id"]
        session["user_id"] = user_id

        return redirect("/")

    else:
        return render_template("register.html")


@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    """Sell shares of stock"""

    # Get current holdings
    rows = db.execute(
        """
        SELECT symbol, SUM(number_of_shares) AS shares
        FROM transactions
        WHERE user_id = ?
        GROUP BY symbol
        HAVING shares > 0
        """,
        session["user_id"]
    )

    print("User ID:", session["user_id"])
    print("Rows:", rows)

    if request.method == "GET":
        return render_template("sell.html", stocks=rows)

    # --- POST LOGIC ---

    symbol = request.form.get("symbol")
    shares = request.form.get("shares")

    if not symbol:
        flash("Must select a stock")
        return redirect("/sell")

    # Validate shares
    try:
        shares = int(shares)
        if shares <= 0:
            raise ValueError
    except:
        flash("Shares must be a positive integer")
        return redirect("/sell")

    # Get how many shares user owns
    owned = db.execute(
        """
        SELECT SUM(number_of_shares) AS shares
        FROM transactions
        WHERE user_id = ? AND symbol = ?
        """,
        session["user_id"], symbol
    )[0]["shares"]

    if owned is None or shares > owned:
        flash("You do not own enough shares")
        return redirect("/sell")

    # Get current price
    stock = lookup(symbol)
    if stock is None:
        flash("Invalid stock symbol")
        return redirect("/sell")

    price = stock["price"]
    total_value = shares * price

    # Add cash to user
    db.execute(
        "UPDATE users SET cash = cash + ? WHERE id = ?",
        total_value, session["user_id"]
    )

    # Record transaction (negative shares)
    db.execute(
        """
        INSERT INTO transactions (user_id, symbol, number_of_shares, price_per_share)
        VALUES (?, ?, ?, ?)
        """,
        session["user_id"], symbol, -shares, price
    )


    flash(f"You sold {shares} shares of {symbol}")
    return redirect("/")

# show name and cash top right
@app.context_processor
def inject_user():
    if "user_id" in session:
        user = db.execute(
            "SELECT username, cash FROM users WHERE id = ?",
            session["user_id"]
        )[0]
        return {
            "username": user["username"],
            "cash": user["cash"]
        }
    return {}

@app.route("/delete_account", methods=["POST"])
@login_required
def delete_account():
    user_id = session["user_id"]

    db.execute("DELETE FROM transactions WHERE user_id = ?", user_id)
    db.execute("DELETE FROM users WHERE id = ?", user_id)

    session.clear()

    flash("Your account has been deleted.")
    return redirect("/login")

@app.route("/leaderboard")
@login_required
def leaderboard():
    """Show leaderboard of all users by total portfolio value"""

    # Get all users
    users = db.execute("SELECT id, username, cash FROM users")

    leaderboard_data = []

    for user in users:
        # Calculate total value of stocks for each user
        rows = db.execute(
            "SELECT symbol, SUM(number_of_shares) AS shares FROM transactions WHERE user_id = ? GROUP BY symbol HAVING shares > 0",
            user["id"]
        )

        total_stocks = 0
        for row in rows:
            stock = lookup(row["symbol"])
            if stock:  # make sure stock exists
                total_stocks += row["shares"] * stock["price"]

        total_value = user["cash"] + total_stocks

        leaderboard_data.append({
            "username": user["username"],
            "total_value": total_value
        })

    # Sort leaderboard by total_value descending
    leaderboard_data.sort(key=lambda x: x["total_value"], reverse=True)

    return render_template("leaderboard.html", leaderboard=leaderboard_data)

import re  # make sure this is already imported at the top

@app.route("/change_password", methods=["GET", "POST"])
@login_required
def change_password():
    """Allow user to change password"""

    if request.method == "POST":
        current_password = request.form.get("current_password")
        new_password = request.form.get("new_password")
        confirmation = request.form.get("confirmation")

        # Get user's current hash
        user = db.execute("SELECT hash FROM users WHERE id = ?", session["user_id"])[0]

        # Check current password
        if not check_password_hash(user["hash"], current_password):
            flash("Current password is incorrect")
            return redirect("/change_password")

        # Check new password confirmation
        if new_password != confirmation:
            flash("New passwords do not match")
            return redirect("/change_password")

        # --- PASSWORD VALIDATION ---
        if len(new_password) < 8:
            flash("Password must be at least 8 characters long")
            return redirect("/change_password")
        # --- END PASSWORD VALIDATION ---

        # Update password
        db.execute("UPDATE users SET hash = ? WHERE id = ?", generate_password_hash(new_password), session["user_id"])

        flash("Password successfully changed!")
        return redirect("/")

    else:
        return render_template("change_password.html")
