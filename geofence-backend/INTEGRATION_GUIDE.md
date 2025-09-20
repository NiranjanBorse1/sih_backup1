# Integration Guide: Geofence Backend

This document explains how the Geofence Backend integrates with other modules in the Smart Tourist Safety system.

## System Architecture

The Geofence Backend is one of three main backend services in the Smart Tourist Safety system:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Authority     │    │   API Gateway   │
│  (React Native) │◄──►│   Dashboard     │◄──►│   (Node.js)     │
│                 │    │  (React/Next)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌────────────────────────────────┼────────────────────────────────┐
                       │                                │                                │
               ┌───────▼────────┐              ┌────────▼────────┐              ┌───────▼────────┐
               │   Blockchain   │              │   Geofence      │              │   AI Engine    │
               │   Service      │              │   Backend       │              │   (Anomaly     │
               │ (Hyperledger)  │              │  (Node.js +     │              │   Detection)   │
               │                │              │   Turf.js)      │              │                │
               └────────────────┘              └─────────────────┘              └────────────────┘
```

## Integration Points

### 1. Integration with Blockchain Service

The Geofence Backend interacts with the Blockchain Service to:
- Log breach events to the immutable ledger
- Retrieve tourist DeID information when needed

#### Implementation

The integration is implemented in `src/integrations/blockchain.service.js`:

```javascript
// Log a breach event to the blockchain
blockchainService.logIncident({
  touristId,
  eventType: 'geofence_breach',
  location: coords,
  geofenceId: result.geofence._id,
  zoneType: result.geofence.zoneType,
  severity: result.geofence.severity,
  timestamp: new Date()
});
```

#### API Contract

| Endpoint | Method | Purpose | Data Format |
|----------|--------|---------|-------------|
| `/blockchain/logIncident` | POST | Record breach events | JSON with touristId, eventType, location, etc. |
| `/blockchain/deid/:touristId` | GET | Get tourist identity | Returns DeID information |

### 2. Integration with AI Engine

The Geofence Backend provides context to the AI Engine for:
- Enhanced anomaly detection with geofence information
- Movement pattern analysis in context of zone types

#### Implementation

The integration is implemented in `src/integrations/ai.service.js`:

```javascript
// Provide zone context to AI Engine
aiService.provideZoneContext(touristId, {
  geofenceId: result.geofence._id,
  zoneType: result.geofence.zoneType,
  severity: result.geofence.severity
});
```

#### API Contract

| Endpoint | Method | Purpose | Data Format |
|----------|--------|---------|-------------|
| `/ai/zoneContext` | POST | Provide geofence context | JSON with touristId and zoneInfo |

### 3. Integration with Alert System

The Geofence Backend triggers the Alert System to:
- Send notifications to tourists who enter restricted areas
- Alert authorities about breach events

#### Implementation

The integration is implemented in `src/integrations/alert.service.js`:

```javascript
// Send alert when breach is detected
alertService.sendAlert({
  touristId,
  alertType: 'geofence_breach',
  location: coords,
  geofenceName: result.geofence.name,
  zoneType: result.geofence.zoneType,
  severity: result.geofence.severity,
  timestamp: new Date()
});
```

#### API Contract

| Endpoint | Method | Purpose | Data Format |
|----------|--------|---------|-------------|
| `/alerts/send` | POST | Send alerts to tourists/authorities | JSON with alertType, touristId, location, etc. |

## Integration Testing

To test the integrations, you need to:

1. Start all services (Blockchain, Geofence, AI, Alert)
2. Create a test geofence using the API
3. Simulate a tourist entering the geofence
4. Verify:
   - Breach event recorded in Blockchain
   - Alert sent to tourist/authorities
   - AI Engine received zone context

### Mock Services for Development

During development, you can use mock services by:

1. Setting the `NODE_ENV=development` in your `.env` file
2. The services will log integration attempts without failing if external services are unavailable

## Troubleshooting Integration Issues

Common integration issues:

1. **Connection Refused**: Ensure all services are running and ports match the `.env` configuration
2. **Authentication Errors**: Check JWT tokens are properly configured
3. **Data Format Errors**: Verify the JSON structure matches the expected format

For more detailed logs, set `LOG_LEVEL=debug` in your `.env` file.

## Next Steps for Integration

1. Implement proper error handling for service unavailability
2. Add circuit breakers for resilient communication
3. Consider implementing message queues for asynchronous communication