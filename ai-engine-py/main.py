# ai_engine/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sklearn.ensemble import IsolationForest
import numpy as np

app = FastAPI(title="AI Anomaly Detection Engine")

# Allow CORS for local development so browser frontends can call this API.
# In production, restrict `allow_origins` to the actual host(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for GPS coordinate with timestamp
class GPSPoint(BaseModel):
    latitude: float
    longitude: float
    timestamp: float  # Unix timestamp

class AnalyzeRequest(BaseModel):
    tourist_id: str
    recent_coordinates: List[GPSPoint]

class AnalyzeResponse(BaseModel):
    anomaly: bool
    risk_score: float
    explanation: str

# Simple anomaly detector class
class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.2)
        self.is_trained = False
        self.training_data = []

    def extract_features(self, coords):
        features = []
        for i in range(1, len(coords)):
            lat1, lon1, t1 = coords[i-1].latitude, coords[i-1].longitude, coords[i-1].timestamp
            lat2, lon2, t2 = coords[i].latitude, coords[i].longitude, coords[i].timestamp
            dist = np.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2)
            time_delta = max(t2 - t1, 1)  # prevent div by zero
            speed = dist / time_delta
            features.append([dist, speed])
        if not features:
            return [[0,0]]
        return features

    def predict(self, coords):
        features = np.array(self.extract_features(coords))
        print("Extracted Features:", features)
        if not self.is_trained:
            self.training_data.append(features)
            training_array = np.vstack(self.training_data)
            self.model.fit(training_array)
            self.is_trained = True
            return False, 0.0, "Model training complete"
        prediction = self.model.predict(features)
        anomaly = any(pred == -1 for pred in prediction)
        risk_score = float(np.min(self.model.score_samples(features)))
        explanation = "Anomaly detected" if anomaly else "No anomaly"
        print("Prediction:", prediction)
        print("Risk score:", risk_score)
        return anomaly, risk_score, explanation


detector = AnomalyDetector()

@app.post("/ai/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    if len(request.recent_coordinates) < 2:
        raise HTTPException(status_code=400, detail="At least 2 coordinates needed")
    anomaly, risk_score, explanation = detector.predict(request.recent_coordinates)
    return AnalyzeResponse(anomaly=anomaly, risk_score=risk_score, explanation=explanation)


@app.post("/ai/zoneContext")
async def zone_context(payload: dict):
    """Receive contextual zone information from other services.

    Expected payload example:
      { "touristId": "id", "zoneInfo": { ... } }
    """
    # For now, accept and acknowledge — in future this can augment model features
    try:
        # lightweight logging for development
        print("Received zone context:", payload)
        return {"status": "ok", "received": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/update_tourist_status")
async def update_tourist_status(payload: dict):
    """Legacy helper endpoint to accept tourist status updates.

    Example: { "userId": "abc", "status": "breach" }
    """
    try:
        print("Update tourist status request:", payload)
        return {"status": "ok", "updated": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))