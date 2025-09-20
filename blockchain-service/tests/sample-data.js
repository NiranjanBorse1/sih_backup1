// Sample tourist data for testing the blockchain service
// This data represents various types of tourists and scenarios

const sampleTourists = [
    {
        name: "John Smith",
        nationality: "USA",
        phoneNumber: "+1-555-123-4567",
        emergencyContact: "+1-555-987-6543",
        email: "john.smith@email.com",
        dateOfBirth: "1985-07-15",
        passportNumber: "US123456789"
    },
    {
        name: "Priya Sharma",
        nationality: "India",
        phoneNumber: "+91-9876543210",
        emergencyContact: "+91-9876543211",
        email: "priya.sharma@gmail.com",
        dateOfBirth: "1992-03-22",
        passportNumber: "M1234567"
    },
    {
        name: "Hans Mueller",
        nationality: "Germany",
        phoneNumber: "+49-30-12345678",
        emergencyContact: "+49-30-87654321",
        email: "hans.mueller@web.de",
        dateOfBirth: "1978-11-08",
        passportNumber: "DE987654321"
    },
    {
        name: "Yuki Tanaka",
        nationality: "Japan",
        phoneNumber: "+81-3-1234-5678",
        emergencyContact: "+81-3-8765-4321",
        email: "yuki.tanaka@example.jp",
        dateOfBirth: "1990-12-05",
        passportNumber: "JP456789123"
    },
    {
        name: "Maria Garcia",
        nationality: "Spain",
        phoneNumber: "+34-91-123-4567",
        emergencyContact: "+34-91-765-4321",
        email: "maria.garcia@correo.es",
        dateOfBirth: "1988-09-12",
        passportNumber: "ES654321987"
    }
];

const sampleIncidents = [
    {
        touristId: "TST_SAMPLE_001", // Will be replaced with actual IDs
        eventType: "breach",
        location: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: "Red Fort, Delhi, India",
            geofenceId: "DANGER_ZONE_001"
        },
        severity: "high",
        description: "Tourist entered restricted archaeological area",
        reportedBy: "geofence-system",
        metadata: {
            detectionMethod: "geofence",
            confidence: 0.95,
            polygonId: "historical_monument_restricted"
        }
    },
    {
        touristId: "TST_SAMPLE_002",
        eventType: "anomaly",
        location: {
            latitude: 19.0760,
            longitude: 72.8777,
            address: "Gateway of India, Mumbai, India"
        },
        severity: "medium",
        description: "Unusual movement pattern detected - tourist stationary for extended period",
        reportedBy: "ai-engine",
        metadata: {
            detectionMethod: "ai_anomaly",
            stationaryDuration: 45,
            lastMovement: "2023-12-20T14:30:00Z"
        }
    },
    {
        touristId: "TST_SAMPLE_003",
        eventType: "sos",
        location: {
            latitude: 27.1751,
            longitude: 78.0421,
            address: "Taj Mahal, Agra, India"
        },
        severity: "critical",
        description: "Emergency SOS alert triggered by tourist",
        reportedBy: "tourist",
        metadata: {
            triggerMethod: "mobile_app",
            sosType: "medical",
            timestamp: "2023-12-20T16:15:30Z"
        }
    },
    {
        touristId: "TST_SAMPLE_004",
        eventType: "alert",
        location: {
            latitude: 15.2993,
            longitude: 74.1240,
            address: "Anjuna Beach, Goa, India"
        },
        severity: "low",
        description: "Tourist near high-risk area during late hours",
        reportedBy: "system",
        metadata: {
            timeOfDay: "23:30",
            riskLevel: "moderate",
            nearbyIncidents: 2
        }
    },
    {
        touristId: "TST_SAMPLE_005",
        eventType: "response",
        location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: "Cubbon Park, Bangalore, India"
        },
        severity: "medium",
        description: "Authority response dispatched to tourist location",
        reportedBy: "authority",
        metadata: {
            responderId: "AUTH_BLR_001",
            responseType: "patrol_unit",
            estimatedArrival: "10 minutes"
        }
    }
];

// Sample regions for testing geographical queries
const sampleRegions = [
    {
        name: "Delhi NCR",
        bounds: {
            north: 28.8,
            south: 28.4,
            east: 77.4,
            west: 76.8
        }
    },
    {
        name: "Mumbai Metropolitan",
        bounds: {
            north: 19.3,
            south: 18.9,
            east: 72.9,
            west: 72.7
        }
    },
    {
        name: "Agra Tourist Zone",
        bounds: {
            north: 27.3,
            south: 27.0,
            east: 78.2,
            west: 77.9
        }
    },
    {
        name: "Goa Coastal Area",
        bounds: {
            north: 15.8,
            south: 15.0,
            east: 74.3,
            west: 73.7
        }
    }
];

// Mock blockchain responses for testing
const mockResponses = {
    registrationSuccess: {
        success: true,
        touristId: "TST_1703123456789_ABC123",
        publicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoI...",
        message: "Tourist DeID registered successfully"
    },
    incidentLogSuccess: {
        success: true,
        incidentId: "INC_1703123456789_XYZ456",
        touristId: "TST_1703123456789_ABC123",
        eventType: "breach",
        timestamp: "2023-12-20T15:30:00Z",
        message: "Incident logged successfully"
    },
    statistics: {
        totalIncidents: 150,
        byEventType: {
            breach: 45,
            anomaly: 30,
            sos: 15,
            alert: 50,
            response: 10
        },
        bySeverity: {
            low: 60,
            medium: 50,
            high: 30,
            critical: 10
        },
        byStatus: {
            open: 25,
            "in-progress": 15,
            resolved: 95,
            closed: 15
        },
        averageResponseTime: 12, // minutes
        dateRange: {
            from: "2023-12-01",
            to: "2023-12-31"
        }
    }
};

// Test scenarios for different use cases
const testScenarios = [
    {
        name: "Tourist Registration Flow",
        description: "Complete tourist registration and verification process",
        steps: [
            "Register new tourist",
            "Verify registration success",
            "Retrieve tourist information",
            "Update tourist status",
            "Verify identity"
        ]
    },
    {
        name: "Emergency Response Flow",
        description: "End-to-end emergency incident handling",
        steps: [
            "Log SOS incident",
            "Authority receives alert",
            "Update incident to in-progress",
            "Log response dispatch",
            "Resolve incident",
            "Close incident"
        ]
    },
    {
        name: "Geofence Breach Flow",
        description: "Automated geofence breach detection and logging",
        steps: [
            "Tourist enters restricted area",
            "Geofence system detects breach",
            "Log breach incident",
            "AI confirms anomaly",
            "Authority responds",
            "Tourist safely guided out"
        ]
    },
    {
        name: "Bulk Operations Flow",
        description: "Testing multiple operations and queries",
        steps: [
            "Register multiple tourists",
            "Log various incidents",
            "Query incidents by region",
            "Generate statistics",
            "Test performance limits"
        ]
    }
];

module.exports = {
    sampleTourists,
    sampleIncidents,
    sampleRegions,
    mockResponses,
    testScenarios
};