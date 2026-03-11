# Full Stack Personal Expense Tracker

A modern, full-stack personal expense tracking web application. It features a clean, responsive UI with glassmorphism effects, a dashboard for tracking total income, expenses, and balance, a dynamic pie chart for visualizing spending by category, transactions listing with CRUD capabilities, search and filtering, currency selection, and CSV export.

## Tech Stack
*   **Frontend**: HTML5, CSS3 (Vanilla, custom CSS variables, responsive grid/flexbox), Vanilla JavaScript. Data visualization powered by Chart.js.
*   **Backend**: Python 3, Flask, Flask-CORS.
*   **Database**: SQLite (`transactions` table).

## Features
*   **Add Income & Expenses**: Form inputs for title, amount, type, category, and date.
*   **CRUD Operations**: Create, Read, Update, and Delete transactions.
*   **Global Currency**: Switch between USD, EUR, GBP, INR, and JPY in the dashboard header.
*   **Dashboard**: Shows total balance, total income, and total expenses.
*   **Analytics**: A responsive pie chart showing expenses grouped by category.
*   **Filter & Search**: Filter transactions by specific month and/or category.
*   **Export**: Download the filtered list of transactions as a CSV file.

## Algorithms and Logic Explained
This project implements several key algorithms and logical flows to manage the data effectively:

1.  **CRUD Operations (Backend HTTP -> SQL Mapping)**
    *   **Create (POST)**: Maps incoming JSON to an `INSERT INTO transactions` SQL query.
    *   **Read (GET)**: Fetches all results via `SELECT * FROM transactions ORDER BY date DESC` and serializes them into JSON.
    *   **Update (PUT)**: Uses an `UPDATE transactions SET ... WHERE id = ?` query.
    *   **Delete (DELETE)**: Executes a `DELETE FROM transactions WHERE id = ?` query.

2.  **Data Aggregation (Dashboard Calculation)**
    *   *Algorithm*: Linear Scan $O(N)$.
    *   *Logic*: The frontend iterates over the filtered transactions array, summing the `amount` fields based on the `type` property (`income` or `expense`) using `Array.reduce()`. Total balance is simply `Total Income - Total Expenses`.

3.  **Category Grouping (Pie Chart Visualization)**
    *   *Algorithm*: Hash Map Aggregation $O(N)$.
    *   *Logic*: A JavaScript object acts as a dictionary. For every transaction where `type === 'expense'`, we check if the category exists as a key in the object. If so, we add the amount to its existing value; otherwise, we initialize it. The resulting object keys (labels) and values (data) are extracted and fed into the Chart.js instance.

4.  **Filtering & Search Logic**
    *   *Algorithm*: Linear Filtering $O(N)$.
    *   *Logic*: When a user selects a month or category, the JavaScript `Array.filter()` runs over the internal transactions list. It uses boolean flags (`matchMonth` and `matchCategory`) to determine if a given transaction should remain visible in the table and be factored into the dashboard / chart recalculation.

5.  **CSV Export Formatting**
    *   *Logic*: The application transforms an array of JS objects into a formatted strings. It escapes fields (such as titles containing commas) and joins individual transaction properties together to create downloadable `text/csv` data via a dynamic Data URL Blob.

## Getting Started

### Prerequisites
*   Python 3.x
*   Node.js (Optional, for serving frontend with `http-server`) or use Python's built-in `http.server`.

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Set up a virtual environment (recommended):
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the Flask API Server:
    ```bash
    python app.py
    ```
    *The server will start on `http://127.0.0.1:5000` and automatically initialize the SQLite database (`database.db`).*

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Serve the application. You can use Python's simple HTTP server:
    ```bash
    python3 -m http.server 8000
    ```
    *Or use any other static server.*
3.  Open your browser and navigate to `http://localhost:8000`.

## Project Structure
```
expense-tracker/
│
├── backend/
│   ├── app.py                # Main Flask API handlers
│   ├── database.py           # SQLite initialization and connection
│   └── requirements.txt      # Python dependencies
│
└── frontend/
    ├── index.html            # Main UI layout and structure
    ├── style.css             # Vanilla CSS, layout, and theming
    └── script.js             # API Integration, Chart.js, and App Logic
```
