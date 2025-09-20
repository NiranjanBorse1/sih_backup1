const mongoose = require('mongoose');

/**
 * GeoJSON Polygon Schema for geofence boundaries
 */
const GeoJSONPolygonSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Polygon'],
    required: true,
    default: 'Polygon'
  },
  coordinates: {
    type: [[[Number]]], // Array of arrays of arrays of numbers (for polygons with holes)
    required: true,
    validate: {
      validator: function(coordinates) {
        // Basic validation: at least 3 points for a polygon and first/last point should be the same
        if (!coordinates || !coordinates.length || !coordinates[0] || coordinates[0].length < 4) {
          return false;
        }
        
        // Check if first and last points are the same (closed polygon)
        const firstPoint = coordinates[0][0];
        const lastPoint = coordinates[0][coordinates[0].length - 1];
        return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
      },
      message: 'Invalid GeoJSON Polygon: Must have at least 3 points and be closed (first and last point must be the same)'
    }
  }
});

/**
 * Geofence Schema
 */
const GeofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  polygon: {
    type: GeoJSONPolygonSchema,
    required: true
  },
  zoneType: {
    type: String,
    enum: ['danger', 'caution', 'safe'],
    required: true
  },
  severity: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
GeofenceSchema.index({ 'polygon.coordinates': '2dsphere' });

const Geofence = mongoose.model('Geofence', GeofenceSchema);

module.exports = Geofence;