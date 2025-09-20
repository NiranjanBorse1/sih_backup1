import requests
import time

API_URL = "http://localhost:8001/ai/analyze"

# Normal GPS coordinates - smooth gradual movement
normal_coords = [
    {"latitude": 28.7041, "longitude": 77.1025, "timestamp": 1694683400},
    {"latitude": 28.7045, "longitude": 77.1030, "timestamp": 1694683460},
    {"latitude": 28.7048, "longitude": 77.1032, "timestamp": 1694683520},
    {"latitude": 28.7050, "longitude": 77.1035, "timestamp": 1694683580},
    {"latitude": 28.7053, "longitude": 77.1037, "timestamp": 1694683640}
]

# Anomalous GPS coordinates - sudden large jump and erratic movement
anomalous_coords = [
    {"latitude": 28.7041, "longitude": 77.1025, "timestamp": 1694683700},
    {"latitude": 28.8041, "longitude": 77.2025, "timestamp": 1694683760},  # sudden jump ~11km away
    {"latitude": 28.8043, "longitude": 77.2027, "timestamp": 1694683820},
    {"latitude": 28.8040, "longitude": 77.2024, "timestamp": 1694683880},  # back and forth (erratic)
    {"latitude": 28.8045, "longitude": 77.2030, "timestamp": 1694683940}
]

def send_data(tourist_id, coords):
    payload = {"tourist_id": tourist_id, "recent_coordinates": coords}
    response = requests.post(API_URL, json=payload)
    print(f"Sent {len(coords)} coords; Response: {response.json()}")

if __name__ == "__main__":
    # Send normal data first to train the model
    print("Sending normal movement data...")
    send_data("tourist123", normal_coords)
    time.sleep(1)

    # Send anomalous data to trigger detection
    print("Sending anomalous movement data...")
    send_data("tourist123", anomalous_coords)