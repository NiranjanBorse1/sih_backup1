# Blockchain Service - Tourist Safety System

## Overview
This service provides decentralized identity (DeID) management and immutable audit trail for the Smart Tourist Safety Monitoring System. Built on Hyperledger Fabric with a 2-organization network.

## Architecture

### Network Participants
- **Org1**: Tourism Authority (Primary)
- **Org2**: Security NGO Partner

### Smart Contracts (Chaincode)
- **DeIDContract**: Tourist identity management
- **IncidentLogContract**: Immutable incident logging

## API Endpoints

### Tourist Identity Management
- `POST /blockchain/registerDeID` - Register new tourist DeID
- `GET /blockchain/deid/:touristId` - Get tourist DeID information

### Incident Management
- `POST /blockchain/logIncident` - Log safety incident
- `GET /blockchain/incidents?touristId=<id>` - Get incidents for tourist
- `GET /blockchain/incidents?region=<polygon>` - Get incidents by region

## Quick Start

### Prerequisites
- Node.js 16+
- Docker & Docker Compose
- Hyperledger Fabric binaries

### Installation
```bash
# Install dependencies
npm install

# Start Hyperledger Fabric network
npm run network:up

# Deploy chaincode
npm run deploy:chaincode

# Start API server
npm start
```

### Development
```bash
# Development mode with auto-reload
npm run dev

# Run tests
npm test
```

## Project Structure
```
blockchain-service/
├── api/                 # REST API server
├── chaincode/          # Smart contracts
├── network/            # Hyperledger Fabric network configuration
├── config/             # Connection profiles and certificates
├── scripts/            # Deployment and utility scripts
├── tests/              # Test files
└── docs/               # API documentation
```

## Configuration
Environment variables are managed through `.env` file:
- `PORT`: API server port (default: 3001)
- `NETWORK_CONFIG_PATH`: Path to network connection profile
- `WALLET_PATH`: Path to user wallet directory
- `CHANNEL_NAME`: Fabric channel name (default: mychannel)
 - `FORCE_DEMO`: When set to `true`, the API will run in demo mode and return simulated responses if Fabric is unavailable. Default is `false`.

## Data Schemas

### Tourist DeID
```json
{
  "touristId": "string (UUID)",
  "publicKey": "string",
  "name": "string",
  "nationality": "string",
  "phoneNumber": "string",
  "emergencyContact": "string",
  "registrationTimestamp": "ISO string",
  "status": "active|inactive"
}
```

### Incident Log
```json
{
  "incidentId": "string (UUID)",
  "touristId": "string",
  "eventType": "breach|anomaly|sos|response",
  "location": {
    "lat": "number",
    "lng": "number",
    "address": "string"
  },
  "timestamp": "ISO string",
  "severity": "low|medium|high|critical",
  "metadata": "object"
}
```

## Testing
Sample test data and API usage examples are provided in the `/tests` directory.

## Security
- All transactions require multi-org endorsement
- Private data is stored off-chain
- Public keys used for identity verification
- Immutable audit trail for all incidents

## Integration
This service integrates with:
- API Gateway for authentication
- Geofence Backend for breach detection
- AI Engine for anomaly detection
- Alert System for emergency notifications

---
**Team**: Visioneers  
**Project**: SIH 2025 - Smart Tourist Safety System  
**Module**: Blockchain Service