# Geofence Backend Module

## Overview

This module is part of the Smart Tourist Safety Monitoring & Incident Response System developed for the SIH Hackathon. The Geofence Backend is responsible for:

- Defining, storing, and serving geofence polygons (danger/safe zones)
- Running server-side checks to determine if a tourist's coordinates are inside a restricted/monitored polygon
- Providing CRUD API for authorities to manage geofences
- Forwarding relevant breach events to the Blockchain & Alert System

## Technical Stack

- **Backend**: Node.js with Express
- **Geospatial Operations**: [@turf/turf](https://turfjs.org) library
- **Database**: MongoDB for persistent storage of polygons and breach history
- **API Documentation**: OpenAPI/Swagger

## API Endpoints

### Geofence Management

- **POST** `/geofence/create` - Create a new geofence polygon (authority only)
  - Request Body: polygon GeoJSON, zone type, severity
- **GET** `/geofence/all` - Retrieve all active geofence polygons
- **GET** `/geofence/:id` - Get a specific geofence by ID
- **PUT** `/geofence/:id` - Update an existing geofence
- **DELETE** `/geofence/:id` - Delete a geofence

### Geofence Checking

- **POST** `/geofence/check` - Check if coordinates are inside any geofence
  - Request Body: touristId, coords (lat, lng)
  - Response: {breach: true/false, zone information}
- **POST** `/geofence/bulkCheck` - Check multiple tourists at once (for groups/tour buses)
  - Request Body: Array of {touristId, coords}
  - Response: Array of breach status for each tourist

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables (create a `.env` file using the `.env.example` template)
4. Start the server:
   ```
   npm run dev
   ```

## Testing

Run the test suite with:
```
npm test
```

## Integration with Other Modules

This module integrates with:

1. **Blockchain Service**: Logs breach events to the immutable ledger
2. **AI Engine**: Provides zone information for more contextual anomaly analysis
3. **Alert System**: Triggers notifications on confirmed breaches

## Data Models

### Geofence Polygon
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "polygon": "GeoJSON Polygon",
  "zoneType": "danger | caution | safe",
  "severity": "high | medium | low",
  "createdBy": "authorityId",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "active": "boolean"
}
```

### Breach Event
```json
{
  "touristId": "string",
  "geofenceId": "string",
  "timestamp": "datetime",
  "coordinates": {
    "lat": "number",
    "lng": "number"
  },
  "zoneType": "danger | caution | safe",
  "severity": "high | medium | low"
}
```