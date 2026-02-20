DROP TABLE transactions;

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    number_of_shares INTEGER NOT NULL,
    price_per_share NUMERIC NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
