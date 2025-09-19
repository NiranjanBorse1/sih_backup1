from flask import Flask, request, jsonify
from flask_cors import CORS
from shapely.geometry import Point, Polygon
import requests
import datetime
import uuid

app = Flask(__name__)
CORS(app)

# --- Geofence with Stateful Alert Management ---
GEOFENCE_POLYGON = None
GEOFENCE_COORDS = [] 
# Use a dictionary to store alerts with unique IDs and states
# States: 'new', 'acknowledged', 'resolved'
ACTIVE_ALERTS = {}

BLOCKCHAIN_LOG_URL = "http://127.0.0.1:5002/add_log"
AI_STATUS_UPDATE_URL = "http://127.0.0.1:5001/update_tourist_status"

def update_tourist_status_in_ai_engine(user_id, status):
    """Helper function to call the AI engine."""
    try:
        requests.post(AI_STATUS_UPDATE_URL, json={'userId': user_id, 'status': status}, timeout=2)
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Could not update tourist status in AI engine: {e}")

@app.route('/set_fence', methods=['POST'])
def set_geofence():
    global GEOFENCE_POLYGON, GEOFENCE_COORDS
    coords = request.json.get('coordinates')
    if not coords or len(coords) < 3:
        return jsonify({'error': 'Polygon requires at least 3 points.'}), 400
    GEOFENCE_COORDS = coords 
    polygon_coords = [(p['lng'], p['lat']) for p in coords]
    GEOFENCE_POLYGON = Polygon(polygon_coords)
    return jsonify({'message': 'Geofence set successfully.'})

@app.route('/get_fence', methods=['GET'])
def get_geofence():
    return jsonify({'coordinates': GEOFENCE_COORDS or []})

@app.route('/check_location', methods=['POST'])
def check_location():
    if not GEOFENCE_POLYGON:
        return jsonify({'status': 'No Geofence Set'})

    data = request.json
    user_info = {'name': data.get('name'), 'digitalId': data.get('digitalId')}
    location = data.get('location')
    if not location or not user_info['name']:
        return jsonify({'error': 'Missing data'}), 400

    user_point = Point(location['lng'], location['lat'])

    if GEOFENCE_POLYGON.contains(user_point):
        alert_id = str(uuid.uuid4())
        alert = {
            'id': alert_id,
            'user': user_info,
            'location': location,
            'timestamp': datetime.datetime.now().isoformat(),
            'message': f"{user_info['name']} entered a restricted area.",
            'type': 'GEOFENCE_BREACH',
            'status': 'new' # Initial status
        }
        ACTIVE_ALERTS[alert_id] = alert
        
        # Log to blockchain and update AI engine status
        requests.post(BLOCKCHAIN_LOG_URL, json={'event': 'GEOFENCE_BREACH', 'details': alert})
        update_tourist_status_in_ai_engine(user_info['digitalId'], 'breach')
        
        return jsonify({'status': 'Breach', 'message': alert['message']})
    else:
        return jsonify({'status': 'Safe'})

# NEW ENDPOINT FOR SOS ALERTS FROM TOURIST APP
@app.route('/sos', methods=['POST'])
def receive_sos():
    data = request.json
    alert_id = str(uuid.uuid4())
    alert = {
        'id': alert_id,
        'user': data.get('user'),
        'location': data.get('location'),
        'timestamp': datetime.datetime.now().isoformat(),
        'message': f"SOS triggered by {data.get('user', {}).get('name')}.",
        'type': 'SOS_ALERT',
        'status': 'new'
    }
    ACTIVE_ALERTS[alert_id] = alert
    
    requests.post(BLOCKCHAIN_LOG_URL, json={'event': 'SOS_ALERT', 'details': alert})
    update_tourist_status_in_ai_engine(data.get('user', {}).get('digitalId'), 'emergency')

    return jsonify({'message': 'SOS alert received and logged.'})

@app.route('/get_alerts', methods=['GET'])
def get_alerts():
    # Return all non-resolved alerts
    return jsonify({'alerts': [alert for alert in ACTIVE_ALERTS.values() if alert['status'] != 'resolved']})

# NEW ENDPOINT FOR DASHBOARD ACTIONS
@app.route('/update_alert_status', methods=['POST'])
def update_alert_status():
    """Allows the dashboard to acknowledge or resolve an alert."""
    data = request.json
    alert_id = data.get('alertId')
    new_status = data.get('status') # 'acknowledged' or 'resolved'
    
    if alert_id in ACTIVE_ALERTS:
        alert = ACTIVE_ALERTS[alert_id]
        alert['status'] = new_status
        
        # Update tourist status in AI engine accordingly
        user_id = alert['user']['digitalId']
        if new_status == 'acknowledged':
            update_tourist_status_in_ai_engine(user_id, 'help-dispatched')
        elif new_status == 'resolved':
            update_tourist_status_in_ai_engine(user_id, 'safe') # Reset status to safe
            
        print(f"✅ Alert {alert_id} status updated to {new_status}")
        return jsonify({'message': 'Alert status updated.'})
    return jsonify({'error': 'Alert not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5003)