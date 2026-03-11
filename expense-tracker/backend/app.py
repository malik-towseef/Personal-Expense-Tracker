from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_db, init_db
import sqlite3

app = Flask(__name__)
# Enable CORS for frontend requests
CORS(app)

# Initialize database on startup
with app.app_context():
    init_db()

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Fetch all transactions from the database."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM transactions ORDER BY date DESC')
    rows = cursor.fetchall()
    
    # Convert sqlite3.Row objects to python dictionaries
    transactions = [dict(row) for row in rows]
    conn.close()
    
    return jsonify(transactions), 200

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction to the database."""
    data = request.get_json()
    
    title = data.get('title')
    amount = data.get('amount')
    category = data.get('category')
    type = data.get('type')
    date = data.get('date')
    
    if not all([title, amount, category, type, date]):
        return jsonify({"error": "Missing required fields."}), 400
    
    try:
        amount = float(amount)
    except ValueError:
        return jsonify({"error": "Amount must be a number."}), 400

    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO transactions (title, amount, category, type, date)
        VALUES (?, ?, ?, ?, ?)
    ''', (title, amount, category, type, date))
    
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Transaction added successfully", "id": new_id}), 201

@app.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    """Update an existing transaction."""
    data = request.get_json()
    
    title = data.get('title')
    amount = data.get('amount')
    category = data.get('category')
    type = data.get('type')
    date = data.get('date')
    
    if not all([title, amount, category, type, date]):
        return jsonify({"error": "Missing required fields."}), 400
        
    try:
        amount = float(amount)
    except ValueError:
        return jsonify({"error": "Amount must be a number."}), 400

    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE transactions
        SET title = ?, amount = ?, category = ?, type = ?, date = ?
        WHERE id = ?
    ''', (title, amount, category, type, date, id))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Transaction not found."}), 404
        
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Transaction updated successfully"}), 200

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    """Delete a transaction."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM transactions WHERE id = ?', (id,))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Transaction not found."}), 404
        
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Transaction deleted successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
