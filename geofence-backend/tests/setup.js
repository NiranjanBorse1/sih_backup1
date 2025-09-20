// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = 3002;
process.env.MONGODB_URI_TEST = 'mongodb://localhost:27017/geofence-backend-test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.BLOCKCHAIN_SERVICE_URL = 'http://localhost:3001';
process.env.AI_ENGINE_URL = 'http://localhost:3003';
process.env.ALERT_SYSTEM_URL = 'http://localhost:3004';

// Set timeout for tests
jest.setTimeout(30000);