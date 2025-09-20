Team Visioneers - Tourist Safety System (Rebuilt)
A simplified, functional rebuild of the Team Visioneers concept. This version focuses on a clear microservice architecture and straightforward frontends, creating a solid foundation for future development.

🚀 Project Overview
The system is composed of two primary parts:

Backend Services: Three independent Flask microservices simulating the core logic:

AI Engine: Performs mock risk analysis on user data.

Blockchain: Simulates user registration on a simple ledger.

Geofence: Monitors tourist location against a predefined safe zone.

Frontend Applications: Two simple HTML web apps:

Tourist App: A portal for users to submit their details for verification.

Authority Dashboard: A dashboard for monitoring tourist activity using mock data.

🛠️ How to Run the Project
Follow these steps to get the full application running on your local machine.

Step 1: Start the Backend Services
You will need to open three separate terminals for this step.

Start the AI Engine (Port 5001)

# In terminal 1:
cd ai_engine
pip install -r requirements.txt
python app.py

Start the Blockchain Service (Port 3001)

# In terminal 2:
cd blockchain-service
npm install
FORCE_DEMO=true PORT=3001 node api/server.js

Start the Geofence Backend (Port 3002)

# In terminal 3:
cd geofence-backend
npm install
npm run dev

Note: Keep all three terminals running simultaneously.

Step 2: Launch the Frontend Applications
The frontend files can be opened directly in your browser.

Navigate to the frontend folder in your file explorer.

Open tourist_app.html to launch the tourist portal.

Open authority_dashboard.html to launch the monitoring dashboard.

Geofence Backend exposes:
- POST `/geofence/create` to persist a polygon (GeoJSON)
- GET `/geofence/all` to fetch polygons for the map
- POST `/geofence/check` to stream live user locations
- GET `/geofence/breaches` and PATCH `/geofence/breaches/:id` for alerts workflow

✅ Usage
Once all services are running, you can use the Tourist App. Fill in your details, get your location, and click "Verify" to see the app communicate with the backend services in real-time. The Authority Dashboard uses mock data to demonstrate its functionality.