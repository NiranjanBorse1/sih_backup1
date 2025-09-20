const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger configuration options
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Geofence Backend API',
      version: '1.0.0',
      description: 'API for managing geofences and checking tourist positions against restricted areas',
      contact: {
        name: 'Team Visioneer\'s',
        email: 'support@visioneers.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      },
      {
        url: 'https://geofence-api.touristsafety.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Geofences',
        description: 'Geofence management operations'
      }
    ],
    components: {
      schemas: {
        GeofenceInput: {
          type: 'object',
          required: ['name', 'polygon', 'zoneType', 'severity'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of the geofence'
            },
            description: {
              type: 'string',
              description: 'Description of the geofence'
            },
            polygon: {
              type: 'object',
              description: 'GeoJSON Polygon',
              properties: {
                type: {
                  type: 'string',
                  enum: ['Polygon'],
                  default: 'Polygon'
                },
                coordinates: {
                  type: 'array',
                  description: 'Array of array of coordinates [lng, lat]',
                  items: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: {
                        type: 'number'
                      },
                      minItems: 2,
                      maxItems: 2
                    },
                    minItems: 4
                  }
                }
              }
            },
            zoneType: {
              type: 'string',
              enum: ['danger', 'caution', 'safe'],
              description: 'Type of zone'
            },
            severity: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Severity level'
            },
            createdBy: {
              type: 'string',
              description: 'ID of the authority creating the geofence'
            }
          }
        },
        Geofence: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier'
            },
            name: {
              type: 'string',
              description: 'Name of the geofence'
            },
            description: {
              type: 'string',
              description: 'Description of the geofence'
            },
            polygon: {
              type: 'object',
              description: 'GeoJSON Polygon'
            },
            zoneType: {
              type: 'string',
              enum: ['danger', 'caution', 'safe'],
              description: 'Type of zone'
            },
            severity: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Severity level'
            },
            createdBy: {
              type: 'string',
              description: 'ID of the authority who created the geofence'
            },
            active: {
              type: 'boolean',
              description: 'Whether the geofence is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        CheckRequest: {
          type: 'object',
          required: ['touristId', 'coords'],
          properties: {
            touristId: {
              type: 'string',
              description: 'ID of the tourist'
            },
            coords: {
              type: 'object',
              required: ['lat', 'lng'],
              properties: {
                lat: {
                  type: 'number',
                  description: 'Latitude',
                  minimum: -90,
                  maximum: 90
                },
                lng: {
                  type: 'number',
                  description: 'Longitude',
                  minimum: -180,
                  maximum: 180
                }
              }
            }
          }
        },
        BulkCheckRequest: {
          type: 'object',
          required: ['checkRequests'],
          properties: {
            checkRequests: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CheckRequest'
              }
            }
          }
        },
        CheckResult: {
          type: 'object',
          properties: {
            breach: {
              type: 'boolean',
              description: 'Whether a geofence breach was detected'
            },
            geofence: {
              type: 'object',
              description: 'Information about the breached geofence (if breach is true)'
            },
            distance: {
              type: 'number',
              description: 'Distance to the nearest geofence in meters (if breach is false)'
            },
            potentialRisk: {
              type: 'boolean',
              description: 'Whether the tourist is close to a geofence boundary'
            }
          }
        },
        BulkCheckResult: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'error']
            },
            results: {
              type: 'integer',
              description: 'Number of results'
            },
            data: {
              type: 'object',
              properties: {
                checkResults: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      touristId: {
                        type: 'string'
                      },
                      breach: {
                        type: 'boolean'
                      },
                      geofence: {
                        type: 'object'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error']
            },
            statusCode: {
              type: 'integer'
            },
            message: {
              type: 'string'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;