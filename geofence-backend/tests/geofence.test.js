const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const Geofence = require('../src/models/geofence.model');
const BreachEvent = require('../src/models/breachEvent.model');

// Mock the integration services
jest.mock('../src/integrations/blockchain.service', () => ({
  logIncident: jest.fn().mockResolvedValue({ status: 'success' })
}));

jest.mock('../src/integrations/alert.service', () => ({
  sendAlert: jest.fn().mockResolvedValue({ status: 'success' })
}));

describe('Geofence API', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/geofence-backend-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await Geofence.deleteMany({});
    await BreachEvent.deleteMany({});
  });

  describe('POST /geofence/create', () => {
    test('should create a new geofence', async () => {
      const geofenceData = {
        name: 'Test Danger Zone',
        description: 'A test danger zone for unit testing',
        polygon: {
          type: 'Polygon',
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
        zoneType: 'danger',
        severity: 'high',
        createdBy: 'test-authority'
      };

      const response = await request(app)
        .post('/geofence/create')
        .send(geofenceData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.geofence.name).toBe(geofenceData.name);
      expect(response.body.data.geofence.zoneType).toBe(geofenceData.zoneType);
      expect(response.body.data.geofence.severity).toBe(geofenceData.severity);
    });

    test('should return validation error for invalid polygon', async () => {
      const invalidGeofenceData = {
        name: 'Invalid Polygon',
        description: 'A polygon with invalid coordinates',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [77.2090, 28.6139],
              [77.2290, 28.6139],
              // Missing coordinates to close the polygon
            ]
          ]
        },
        zoneType: 'danger',
        severity: 'high',
        createdBy: 'test-authority'
      };

      const response = await request(app)
        .post('/geofence/create')
        .send(invalidGeofenceData)
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /geofence/all', () => {
    test('should get all geofences', async () => {
      // Create test geofences
      await Geofence.create({
        name: 'Test Zone 1',
        description: 'Test Zone 1 Description',
        polygon: {
          type: 'Polygon',
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
        zoneType: 'danger',
        severity: 'high',
        createdBy: 'test-authority'
      });

      await Geofence.create({
        name: 'Test Zone 2',
        description: 'Test Zone 2 Description',
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [77.3090, 28.7139],
              [77.3290, 28.7139],
              [77.3290, 28.7339],
              [77.3090, 28.7339],
              [77.3090, 28.7139]
            ]
          ]
        },
        zoneType: 'caution',
        severity: 'medium',
        createdBy: 'test-authority'
      });

      const response = await request(app)
        .get('/geofence/all')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.geofences).toHaveLength(2);
      expect(response.body.data.geofences[0].name).toBe('Test Zone 1');
      expect(response.body.data.geofences[1].name).toBe('Test Zone 2');
    });
  });

  describe('POST /geofence/check', () => {
    test('should detect breach when point is inside geofence', async () => {
      // Create a test geofence
      const geofence = await Geofence.create({
        name: 'Test Danger Zone',
        description: 'A test danger zone for unit testing',
        polygon: {
          type: 'Polygon',
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
        zoneType: 'danger',
        severity: 'high',
        createdBy: 'test-authority'
      });

      // Test point inside the geofence
      const checkData = {
        touristId: 'test-tourist-1',
        coords: {
          lat: 28.6239,
          lng: 77.2190
        }
      };

      const response = await request(app)
        .post('/geofence/check')
        .send(checkData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.breach).toBe(true);
      expect(response.body.data.geofence._id).toBe(geofence._id.toString());

      // Verify that a breach event was recorded
      const breachEvents = await BreachEvent.find({ touristId: checkData.touristId });
      expect(breachEvents).toHaveLength(1);
      expect(breachEvents[0].geofenceId.toString()).toBe(geofence._id.toString());
    });

    test('should not detect breach when point is outside geofence', async () => {
      // Create a test geofence
      await Geofence.create({
        name: 'Test Danger Zone',
        description: 'A test danger zone for unit testing',
        polygon: {
          type: 'Polygon',
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
        zoneType: 'danger',
        severity: 'high',
        createdBy: 'test-authority'
      });

      // Test point outside the geofence
      const checkData = {
        touristId: 'test-tourist-2',
        coords: {
          lat: 28.7000,
          lng: 77.3000
        }
      };

      const response = await request(app)
        .post('/geofence/check')
        .send(checkData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.breach).toBe(false);

      // Verify that no breach event was recorded
      const breachEvents = await BreachEvent.find({ touristId: checkData.touristId });
      expect(breachEvents).toHaveLength(0);
    });
  });

  describe('POST /geofence/bulkCheck', () => {
    test('should process multiple check requests', async () => {
      // Create a test geofence
      await Geofence.create({
        name: 'Test Danger Zone',
        description: 'A test danger zone for unit testing',
        polygon: {
          type: 'Polygon',
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
        zoneType: 'danger',
        severity: 'high',
        createdBy: 'test-authority'
      });

      // Test bulk check with one point inside and one outside
      const bulkCheckData = {
        checkRequests: [
          {
            touristId: 'tourist-1',
            coords: {
              lat: 28.6239,
              lng: 77.2190
            }
          },
          {
            touristId: 'tourist-2',
            coords: {
              lat: 28.7000,
              lng: 77.3000
            }
          }
        ]
      };

      const response = await request(app)
        .post('/geofence/bulkCheck')
        .send(bulkCheckData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.checkResults).toHaveLength(2);
      
      // First tourist should have a breach
      expect(response.body.data.checkResults[0].touristId).toBe('tourist-1');
      expect(response.body.data.checkResults[0].breach).toBe(true);
      
      // Second tourist should not have a breach
      expect(response.body.data.checkResults[1].touristId).toBe('tourist-2');
      expect(response.body.data.checkResults[1].breach).toBe(false);

      // Verify breach events
      const breachEvents = await BreachEvent.find({});
      expect(breachEvents).toHaveLength(1);
      expect(breachEvents[0].touristId).toBe('tourist-1');
    });
  });
});