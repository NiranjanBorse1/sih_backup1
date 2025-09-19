from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import hashlib
import json

app = Flask(__name__)
CORS(app)

# --- Enhanced Blockchain with Audit Log ---

class Block:
    def __init__(self, index, timestamp, data, event_type, previous_hash):
        self.index = index
        self.timestamp = str(timestamp)
        self.data = data
        self.event_type = event_type # e.g., 'REGISTRATION', 'GEOFENCE_BREACH'
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        block_string = str(self.index) + self.timestamp + json.dumps(self.data, sort_keys=True) + self.event_type + str(self.previous_hash)
        return hashlib.sha256(block_string.encode()).hexdigest()

# Initialize the blockchain with a Genesis Block
MOCK_BLOCKCHAIN = [Block(0, datetime.now(), "Genesis Block", "INITIAL", "0")]

@app.route('/register', methods=['POST'])
def register_user():
    """Registers a new user, creating a block on the chain."""
    data = request.json
    if not data or 'name' not in data or 'digitalId' not in data:
        return jsonify({'error': 'Missing registration data'}), 400

    previous_block = MOCK_BLOCKCHAIN[-1]
    new_block = Block(
        index=previous_block.index + 1,
        timestamp=datetime.now(),
        data=data,
        event_type="REGISTRATION",
        previous_hash=previous_block.hash
    )
    MOCK_BLOCKCHAIN.append(new_block)
    print(f"✅ Blockchain: Registered {data['name']}. TxID: {new_block.hash}")
    return jsonify({'message': 'User registered on the blockchain successfully.', 'transactionId': new_block.hash})

@app.route('/add_log', methods=['POST'])
def add_audit_log():
    """Adds a new audit log entry (e.g., for alerts) to the blockchain."""
    log_data = request.json
    if not log_data or 'event' not in log_data or 'details' not in log_data:
        return jsonify({'error': 'Missing log data'}), 400
        
    previous_block = MOCK_BLOCKCHAIN[-1]
    new_block = Block(
        index=previous_block.index + 1,
        timestamp=datetime.now(),
        data=log_data['details'],
        event_type=log_data['event'],
        previous_hash=previous_block.hash
    )
    MOCK_BLOCKCHAIN.append(new_block)
    print(f"✅ Blockchain: Logged event '{log_data['event']}'. TxID: {new_block.hash}")
    return jsonify({'message': f"Event '{log_data['event']}' logged successfully.", 'transactionId': new_block.hash})

@app.route('/chain', methods=['GET'])
def get_chain():
    """Returns the entire blockchain."""
    chain_data = [block.__dict__ for block in MOCK_BLOCKCHAIN]
    return jsonify({'chain': chain_data, 'length': len(chain_data)})

if __name__ == '__main__':
    app.run(debug=True, port=5002)