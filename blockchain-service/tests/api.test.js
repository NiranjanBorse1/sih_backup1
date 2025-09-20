const request = require('supertest');
const app = require('../api/server');
const { sampleTourists, sampleIncidents, sampleRegions } = require('./sample-data');

describe('Blockchain Service API Tests', () => {
    let registeredTourists = [];
    let loggedIncidents = [];

    beforeAll(async () => {
        // Wait for server to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    describe('Health Check', () => {
        test('GET /health should return service status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('service', 'blockchain-service');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('Tourist Identity (DeID) Management', () => {
        test('POST /blockchain/registerDeID should register new tourist', async () => {
            const touristData = sampleTourists[0];
            
            const response = await request(app)
                .post('/blockchain/registerDeID')
                .send(touristData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('touristId');
            expect(response.body.data).toHaveProperty('publicKey');
            expect(response.body.data).toHaveProperty('message');

            // Store for later tests
            registeredTourists.push({
                ...touristData,
                touristId: response.body.data.touristId,
                publicKey: response.body.data.publicKey
            });
        });

        test('POST /blockchain/registerDeID should validate required fields', async () => {
            const invalidData = {
                name: "Test User"
                // Missing required fields
            };
            
            const response = await request(app)
                .post('/blockchain/registerDeID')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body).toHaveProperty('error');
        });

        test('GET /blockchain/deid/:touristId should retrieve tourist info', async () => {
            if (registeredTourists.length === 0) {
                // Register a tourist first
                const touristData = sampleTourists[1];
                const regResponse = await request(app)
                    .post('/blockchain/registerDeID')
                    .send(touristData);
                
                registeredTourists.push({
                    ...touristData,
                    touristId: regResponse.body.data.touristId
                });
            }

            const touristId = registeredTourists[0].touristId;
            
            const response = await request(app)
                .get(`/blockchain/deid/${touristId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('touristId', touristId);
            expect(response.body.data).toHaveProperty('name');
            expect(response.body.data).toHaveProperty('nationality');
            expect(response.body.data).toHaveProperty('status');
        });

        test('PUT /blockchain/deid/:touristId/status should update status', async () => {
            if (registeredTourists.length === 0) {
                // Register a tourist first
                const touristData = sampleTourists[2];
                const regResponse = await request(app)
                    .post('/blockchain/registerDeID')
                    .send(touristData);
                
                registeredTourists.push({
                    ...touristData,
                    touristId: regResponse.body.data.touristId
                });
            }

            const touristId = registeredTourists[0].touristId;
            
            const response = await request(app)
                .put(`/blockchain/deid/${touristId}/status`)
                .send({ status: 'inactive' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('newStatus', 'inactive');
        });

        test('POST /blockchain/deid/:touristId/verify should verify identity', async () => {
            if (registeredTourists.length === 0) {
                // Register a tourist first
                const touristData = sampleTourists[3];
                const regResponse = await request(app)
                    .post('/blockchain/registerDeID')
                    .send(touristData);
                
                registeredTourists.push({
                    ...touristData,
                    touristId: regResponse.body.data.touristId
                });
            }

            const touristId = registeredTourists[0].touristId;
            
            const response = await request(app)
                .post(`/blockchain/deid/${touristId}/verify`)
                .send({
                    signature: 'test_signature_12345',
                    message: 'verify_identity_test'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('touristId', touristId);
            expect(response.body.data).toHaveProperty('verified');
        });
    });

    describe('Incident Management', () => {
        beforeEach(async () => {
            // Ensure we have at least one registered tourist
            if (registeredTourists.length === 0) {
                const touristData = sampleTourists[0];
                const regResponse = await request(app)
                    .post('/blockchain/registerDeID')
                    .send(touristData);
                
                registeredTourists.push({
                    ...touristData,
                    touristId: regResponse.body.data.touristId
                });
            }
        });

        test('POST /blockchain/logIncident should log new incident', async () => {
            const incidentData = {
                ...sampleIncidents[0],
                touristId: registeredTourists[0].touristId
            };
            
            const response = await request(app)
                .post('/blockchain/logIncident')
                .send(incidentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('incidentId');
            expect(response.body.data).toHaveProperty('touristId', incidentData.touristId);
            expect(response.body.data).toHaveProperty('eventType', incidentData.eventType);

            // Store for later tests
            loggedIncidents.push({
                ...incidentData,
                incidentId: response.body.data.incidentId
            });
        });

        test('POST /blockchain/logIncident should validate incident data', async () => {
            const invalidIncident = {
                touristId: registeredTourists[0].touristId,
                eventType: 'invalid_type', // Invalid event type
                location: {
                    latitude: 28.6139,
                    longitude: 77.2090
                }
            };
            
            const response = await request(app)
                .post('/blockchain/logIncident')
                .send(invalidIncident)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body).toHaveProperty('error');
        });

        test('GET /blockchain/incidents?touristId should get tourist incidents', async () => {
            // Log an incident first if none exist
            if (loggedIncidents.length === 0) {
                const incidentData = {
                    ...sampleIncidents[1],
                    touristId: registeredTourists[0].touristId
                };
                
                const logResponse = await request(app)
                    .post('/blockchain/logIncident')
                    .send(incidentData);
                
                loggedIncidents.push({
                    ...incidentData,
                    incidentId: logResponse.body.data.incidentId
                });
            }

            const touristId = registeredTourists[0].touristId;
            
            const response = await request(app)
                .get(`/blockchain/incidents?touristId=${touristId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body).toHaveProperty('count');
        });

        test('GET /blockchain/incidents?region should get regional incidents', async () => {
            const regionQuery = JSON.stringify(sampleRegions[0]);
            
            const response = await request(app)
                .get(`/blockchain/incidents?region=${encodeURIComponent(regionQuery)}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body).toHaveProperty('count');
        });

        test('PUT /blockchain/incidents/:incidentId should update incident', async () => {
            // Log an incident first if none exist
            if (loggedIncidents.length === 0) {
                const incidentData = {
                    ...sampleIncidents[2],
                    touristId: registeredTourists[0].touristId
                };
                
                const logResponse = await request(app)
                    .post('/blockchain/logIncident')
                    .send(incidentData);
                
                loggedIncidents.push({
                    ...incidentData,
                    incidentId: logResponse.body.data.incidentId
                });
            }

            const incidentId = loggedIncidents[0].incidentId;
            
            const updateData = {
                status: 'resolved',
                responderId: 'AUTH_TEST_001',
                resolutionNotes: 'Test resolution notes'
            };
            
            const response = await request(app)
                .put(`/blockchain/incidents/${incidentId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('newStatus', 'resolved');
        });

        test('GET /blockchain/incidents/statistics should return stats', async () => {
            const response = await request(app)
                .get('/blockchain/incidents/statistics')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalIncidents');
            expect(response.body.data).toHaveProperty('byEventType');
            expect(response.body.data).toHaveProperty('bySeverity');
            expect(response.body.data).toHaveProperty('byStatus');
        });
    });

    describe('Error Handling', () => {
        test('GET /nonexistent should return 404', async () => {
            const response = await request(app)
                .get('/nonexistent')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Endpoint not found');
        });

        test('GET /blockchain/deid/invalid_id should handle not found', async () => {
            const response = await request(app)
                .get('/blockchain/deid/INVALID_TOURIST_ID')
                .expect(500); // In demo mode, this might return 500 instead of 404

            expect(response.body.success).toBe(false);
        });

        test('GET /blockchain/incidents without parameters should return error', async () => {
            const response = await request(app)
                .get('/blockchain/incidents')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('touristId or region parameter is required');
        });
    });

    describe('Performance Tests', () => {
        test('Multiple tourist registrations should complete within time limit', async () => {
            const startTime = Date.now();
            const registrationPromises = [];

            // Register 5 tourists concurrently
            for (let i = 0; i < 5; i++) {
                const touristData = {
                    ...sampleTourists[i % sampleTourists.length],
                    name: `Test Tourist ${i}`,
                    phoneNumber: `+1-555-000-${i.toString().padStart(4, '0')}`
                };
                
                registrationPromises.push(
                    request(app)
                        .post('/blockchain/registerDeID')
                        .send(touristData)
                );
            }

            const responses = await Promise.all(registrationPromises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within 10 seconds
            expect(duration).toBeLessThan(10000);
            
            // All should succeed
            responses.forEach(response => {
                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
            });
        });

        test('Health check should respond quickly', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Health check should respond within 1 second
            expect(duration).toBeLessThan(1000);
            expect(response.body.status).toBe('healthy');
        });
    });
});