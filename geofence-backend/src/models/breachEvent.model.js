const mongoose = require('mongoose');

/**
 * Breach Event Schema - Records when a tourist enters a geofence
 */
const BreachEventSchema = new mongoose.Schema({
  touristId: {
    type: String,
    required: true,
    index: true
  },
  geofenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Geofence',
    required: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
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
  processed: {
    type: Boolean,
    default: false
  },
  forwardedToBlockchain: {
    type: Boolean,
    default: false
  },
  alertSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for common queries
BreachEventSchema.index({ touristId: 1, timestamp: -1 });
BreachEventSchema.index({ geofenceId: 1, timestamp: -1 });
BreachEventSchema.index({ processed: 1 });

const BreachEvent = mongoose.model('BreachEvent', BreachEventSchema);

module.exports = BreachEvent;