const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load environment variables
require('dotenv').config();

// Import routes
const geofenceRoutes = require('./routes/geofence.routes');

// Import middleware
const errorHandler = require('./middleware/error.middleware');

// Initialize express app
const app = express();

// Set up middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Request logging

// Using JSON file storage instead of MongoDB
console.log('Using JSON file storage for geofences and breach events');

// Swagger documentation setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Geofence Backend API',
      version: '1.0.0',
      description: 'API for managing geofences and checking tourist positions against restricted areas',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3002}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
// Legacy/compatibility endpoints for tourist app alerts
const geofenceController = require('./controllers/geofence.controller');
app.post('/alerts/sos', (req, res, next) => geofenceController.receiveSOS(req, res, next));

app.use('/geofence', geofenceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'geofence-backend' });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Geofence Backend server running on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // In production, we might want to exit and let the process manager restart
  // process.exit(1);
});

module.exports = app;