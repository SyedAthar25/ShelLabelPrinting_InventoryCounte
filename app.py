from flask import Flask, jsonify
import pyodbc

app = Flask(__name__)

# SQL Server connection string (matching server.js)
CONNECTION_STRING = (
    'DRIVER={ODBC Driver 18 for SQL Server};'
    'SERVER=localhost;'
    'DATABASE=Inventory_Database;'
    'Trusted_Connection=Yes;'
    'Encrypt=Yes;'
    'TrustServerCertificate=Yes;'
)

def get_db_connection():
    return pyodbc.connect(CONNECTION_STRING)

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'Test endpoint working!'}), 200

@app.route('/api/items', methods=['GET'])
def items():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM dbo.inventory_count_table')
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        items = [dict(zip(columns, row)) for row in rows]
        return jsonify(items), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)

