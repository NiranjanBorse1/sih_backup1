from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import IsolationForest
import numpy as np
import random
import time

app = Flask(__name__)
CORS(app)

# --- Anomaly Detection & Live Tourist Simulation ---
np.random.seed(42)
normal_data = np.random.normal(loc=[18.5196, 73.8553], scale=[0.01, 0.01], size=(500, 2))
model = IsolationForest(contamination=0.05, random_state=42)
model.fit(normal_data)
print("✅ AI Engine: Isolation Forest model trained.")

# In-memory store for active tourists
ACTIVE_TOURISTS = {}

# NEW ENDPOINT FOR DASHBOARD
@app.route('/get_active_tourists', methods=['GET'])
def get_active_tourists():
    """Simulates moving tourists for the dashboard map."""
    for tourist in ACTIVE_TOURISTS.values():
        # Simulate slight movement
        tourist['location']['lat'] += random.uniform(-0.0001, 0.0001)
        tourist['location']['lng'] += random.uniform(-0.0001, 0.0001)
    return jsonify(list(ACTIVE_TOURISTS.values()))

@app.route('/analyze', methods=['POST'])
def analyze_data():
    """Analyzes user location and adds them to the active list."""
    data = request.json
    user_id = data.get('digitalId')
    name = data.get('name')
    location = data.get('location')

    if not all([user_id, name, location]):
        return jsonify({'error': 'Missing data'}), 400

    # Add or update tourist in our active list
    ACTIVE_TOURISTS[user_id] = {
        'id': user_id,
        'name': name,
        'location': location,
        'status': 'safe', # Default status
        'lastUpdate': time.time()
    }
    
    try:
        user_coords = np.array([[location['lat'], location['lng']]])
        prediction = model.predict(user_coords)
        
        if prediction[0] == -1:
            risk_score = 90
            message = "Anomaly detected in movement pattern. High risk."
            ACTIVE_TOURISTS[user_id]['status'] = 'at-risk'
        else:
            risk_score = random.randint(10, 30)
            message = "Movement pattern appears normal. Low risk."

        print(f"Analyzed {name}: Risk Score = {risk_score}")

        return jsonify({
            'userId': user_id, 'name': name, 'riskScore': risk_score,
            'message': message, 'status': 'success'
        })

    except Exception as e:
        return jsonify({'error': f'Invalid data: {e}'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5001)