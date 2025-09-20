# Geofence Backend API Documentation

## Accessing the API Documentation

The geofence backend includes Swagger documentation which provides a complete overview of all available API endpoints and their usage.

To access the documentation:

1. Make sure your geofence backend server is running:
   ```
   cd geofence-backend
   npm run dev
   ```

2. Open your web browser and navigate to:
   [http://localhost:3002/api-docs](http://localhost:3002/api-docs)

This will display the interactive Swagger UI where you can:
- See all available endpoints
- Understand request and response formats
- Try out API calls directly from the browser

## Available Endpoints

### Geofence Management

- **POST /geofence/create** - Create a new geofence polygon
- **GET /geofence/all** - Get all active geofences
- **GET /geofence/:id** - Get a specific geofence by ID
- **PUT /geofence/:id** - Update an existing geofence
- **DELETE /geofence/:id** - Delete a geofence (soft delete)

### Breach Detection

- **POST /geofence/check** - Check if coordinates are inside any geofence
- **POST /geofence/bulkCheck** - Check multiple tourists' positions simultaneously

## Integration with Other Modules

The geofence backend integrates with:

1. **Blockchain Service** - Records breach events in Hyperledger Fabric
2. **AI Engine** - Provides context to the anomaly detection system
3. **Alert System** - Triggers notifications when breaches are detected

## Example API Usage

### Creating a Geofence

```javascript
const axios = require('axios');

const geofenceData = {
  name: "Danger Zone",
  description: "Restricted area due to safety concerns",
  polygon: {
    type: "Polygon",
    coordinates: [
      [
        [77.2090, 28.6139],
        [77.2290, 28.6139],
        [77.2290, 28.6339],
        [77.2090, 28.6339],
        [77.2090, 28.6139]
      ]
    ]
  },
  zoneType: "danger",
  severity: "high",
  createdBy: "authority-1"
};

axios.post('http://localhost:3002/geofence/create', geofenceData)
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

### Checking Tourist Position

```javascript
const axios = require('axios');

const checkData = {
  touristId: "tourist-123",
  coords: {
    lat: 28.6200,
    lng: 77.2200
  }
};

axios.post('http://localhost:3002/geofence/check', checkData)
  .then(response => {
    if (response.data.data.breach) {
      console.log("Warning! Tourist is in a restricted area!");
      console.log("Zone type:", response.data.data.geofence.zoneType);
      console.log("Severity:", response.data.data.geofence.severity);
    } else {
      console.log("Tourist is in a safe area");
    }
  })
  .catch(error => console.error(error));
```