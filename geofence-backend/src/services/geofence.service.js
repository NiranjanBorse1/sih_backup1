const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/geofences.json');
const BREACH_FILE = path.join(__dirname, '../data/breachEvents.json');

/**
 * Geofence Service - Handles all geofence operations using Turf.js
 */
class GeofenceService {
  /**
   * Log a breach event
   * @param {Object} eventData - Breach event data
   * @returns {Promise<Object>} - Logged event
   */
  async logBreachEvent(eventData) {
    try {
      let events = [];
      if (fs.existsSync(BREACH_FILE)) {
        events = JSON.parse(fs.readFileSync(BREACH_FILE));
      }
      const id = Date.now().toString();
      const newEvent = { id, ...eventData, timestamp: new Date().toISOString() };
      events.push(newEvent);
      fs.writeFileSync(BREACH_FILE, JSON.stringify(events, null, 2));
      return newEvent;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing breach event by id
   * @param {string} id - Breach event id
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Updated breach event
   */
  async updateBreachEvent(id, updates) {
    try {
      let breachEvents = [];
      if (fs.existsSync(BREACH_FILE)) {
        try {
          breachEvents = JSON.parse(fs.readFileSync(BREACH_FILE));
        } catch (e) {
          breachEvents = [];
        }
      }

      const idx = breachEvents.findIndex(be => be.id === id);
      if (idx === -1) throw new Error('Breach event not found');

      breachEvents[idx] = { ...breachEvents[idx], ...updates };
      fs.writeFileSync(BREACH_FILE, JSON.stringify(breachEvents, null, 2));
      return breachEvents[idx];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all breach events
   * @returns {Promise<Array>} - List of breach events
   */
  async getAllBreachEvents() {
    try {
      let events = [];
      if (fs.existsSync(BREACH_FILE)) {
        events = JSON.parse(fs.readFileSync(BREACH_FILE));
      }
      return events;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Create a new geofence polygon
   * @param {Object} geofenceData - Geofence data including polygon, name, etc.
   * @returns {Promise<Object>} - Created geofence
   */
  async createGeofence(geofenceData) {
    try {
      // Validate polygon using Turf.js
      const polygon = geofenceData.polygon;
      if (polygon.type !== 'Polygon' || !Array.isArray(polygon.coordinates)) {
        throw new Error('Invalid polygon format: must be a GeoJSON Polygon');
      }
      // Basic Turf validation
      try {
        turf.polygon(polygon.coordinates);
      } catch (err) {
        throw new Error(`Polygon validation failed: ${err.message}`);
      }
      // Read existing geofences
      let geofences = [];
      if (fs.existsSync(DATA_FILE)) {
        geofences = JSON.parse(fs.readFileSync(DATA_FILE));
      }
      // Assign an ID
      const id = Date.now().toString();
      const newGeofence = { id, ...geofenceData, active: true, createdAt: new Date().toISOString() };
      geofences.push(newGeofence);
      fs.writeFileSync(DATA_FILE, JSON.stringify(geofences, null, 2));
      return newGeofence;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get all active geofences
   * @returns {Promise<Array>} - List of active geofences
   */
  async getAllGeofences() {
    try {
      let geofences = [];
      if (fs.existsSync(DATA_FILE)) {
        geofences = JSON.parse(fs.readFileSync(DATA_FILE));
      }
      return geofences.filter(g => g.active);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get a geofence by ID
   * @param {string} id - Geofence ID
   * @returns {Promise<Object>} - Geofence object
   */
  async getGeofenceById(id) {
    try {
      let geofences = [];
      if (fs.existsSync(DATA_FILE)) {
        geofences = JSON.parse(fs.readFileSync(DATA_FILE));
      }
      const geofence = geofences.find(g => g.id === id);
      if (!geofence) {
        throw new Error('Geofence not found');
      }
      return geofence;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Update an existing geofence
   * @param {string} id - Geofence ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated geofence
   */
  async updateGeofence(id, updateData) {
    try {
      let geofences = [];
      if (fs.existsSync(DATA_FILE)) {
        geofences = JSON.parse(fs.readFileSync(DATA_FILE));
      }
      const idx = geofences.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Geofence not found');
      // If updating the polygon, validate it
      if (updateData.polygon) {
        const polygon = updateData.polygon;
        if (polygon.type !== 'Polygon' || !Array.isArray(polygon.coordinates)) {
          throw new Error('Invalid polygon format: must be a GeoJSON Polygon');
        }
        try {
          turf.polygon(polygon.coordinates);
        } catch (err) {
          throw new Error(`Polygon validation failed: ${err.message}`);
        }
      }
      geofences[idx] = { ...geofences[idx], ...updateData };
      fs.writeFileSync(DATA_FILE, JSON.stringify(geofences, null, 2));
      return geofences[idx];
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Delete a geofence (soft delete by setting active to false)
   * @param {string} id - Geofence ID
   * @returns {Promise<Object>} - Deleted geofence
   */
  async deleteGeofence(id) {
    try {
      let geofences = [];
      if (fs.existsSync(DATA_FILE)) {
        geofences = JSON.parse(fs.readFileSync(DATA_FILE));
      }
      const idx = geofences.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Geofence not found');
      geofences[idx].active = false;
      fs.writeFileSync(DATA_FILE, JSON.stringify(geofences, null, 2));
      return geofences[idx];
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Check if a point is inside any active geofence
   * @param {Object} coords - Point coordinates {lat, lng}
   * @returns {Promise<Object>} - Breach information or null if no breach
   */
  async checkPoint(coords) {
    try {
      // Convert to GeoJSON point
      const point = turf.point([coords.lng, coords.lat]);
      
      // Get all active geofences
      let geofences = [];
      if (fs.existsSync(DATA_FILE)) {
        geofences = JSON.parse(fs.readFileSync(DATA_FILE));
      }
      const activeGeofences = geofences.filter(g => g.active);
      
      // Check each geofence
      for (const geofence of activeGeofences) {
        const polygon = turf.polygon(geofence.polygon.coordinates);
        
        // Check if point is inside polygon
        if (turf.booleanPointInPolygon(point, polygon)) {
          return {
            breach: true,
            geofence: geofence,
            distance: 0 // Inside the polygon
          };
        }
        
        // If not inside, calculate distance to polygon
        const distance = turf.pointToPolygonDistance(point, polygon, { units: 'meters' });
        
        // If very close to the boundary (within 10 meters), consider it a potential risk
        if (distance < 10) {
          return {
            breach: false,
            geofence: geofence,
            distance: distance,
            potentialRisk: true
          };
        }
      }
      
      // No breach detected
      return { breach: false };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Record a breach event
   * @param {string} touristId - Tourist ID
   * @param {Object} coords - Point coordinates {lat, lng}
   * @param {Object} geofence - Breached geofence
   * @returns {Promise<Object>} - Created breach event
   */
  async recordBreachEvent(touristId, coords, geofence) {
    try {
      const breachEvent = {
        id: Date.now().toString(),
        touristId,
        geofenceId: geofence.id,
        coordinates: coords,
        zoneType: geofence.zoneType,
        severity: geofence.severity,
        status: 'new',
        forwardedToBlockchain: false,
        alertSent: false,
        processed: false,
        timestamp: new Date().toISOString()
      };
      // Read existing breach events from the JSON file (BREACH_FILE)
      let breachEvents = [];
      if (fs.existsSync(BREACH_FILE)) {
        try {
          breachEvents = JSON.parse(fs.readFileSync(BREACH_FILE));
        } catch (e) {
          // If file is corrupted or empty, start fresh
          breachEvents = [];
        }
      }

      // Add new breach event and persist
      breachEvents.push(breachEvent);
      fs.writeFileSync(BREACH_FILE, JSON.stringify(breachEvents, null, 2));
      
      return breachEvent;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Check if multiple points (bulk check) are inside any geofence
   * @param {Array} checkRequests - Array of {touristId, coords} objects
   * @returns {Promise<Array>} - Array of breach check results
   */
  async bulkCheckPoints(checkRequests) {
    try {
      // Get all active geofences once
      let geofences = [];
      if (fs.existsSync(DATA_FILE)) {
        geofences = JSON.parse(fs.readFileSync(DATA_FILE));
      }
      const activeGeofences = geofences.filter(g => g.active);
      
      // Process each check request
      const results = [];
      
      for (const request of checkRequests) {
        const { touristId, coords } = request;
        
        // Convert to GeoJSON point
        const point = turf.point([coords.lng, coords.lat]);
        
        let breachDetected = false;
        let breachedGeofence = null;
        
        // Check each geofence
        for (const geofence of activeGeofences) {
          const polygon = turf.polygon(geofence.polygon.coordinates);
          
          // Check if point is inside polygon
          if (turf.booleanPointInPolygon(point, polygon)) {
            breachDetected = true;
            breachedGeofence = geofence;
            
            // Record the breach event
            await this.recordBreachEvent(touristId, coords, geofence);
            
            break; // Stop checking other geofences after first breach
          }
        }
        
        // Add result to the array
        results.push({
          touristId,
          breach: breachDetected,
          ...(breachedGeofence && {
            geofence: {
              id: breachedGeofence.id,
              name: breachedGeofence.name,
              zoneType: breachedGeofence.zoneType,
              severity: breachedGeofence.severity
            }
          })
        });
      }
      
      return results;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Helper function to check if a polygon is valid (no self-intersections)
   * @param {Array} coordinates - Array of [lng, lat] points
   * @returns {boolean} - True if valid, false otherwise
   */
  isValidPolygon(coordinates) {
    try {
      // Create line segments from consecutive points
      const segments = [];
      for (let i = 0; i < coordinates.length - 1; i++) {
        segments.push([coordinates[i], coordinates[i + 1]]);
      }
      
      // Check for intersections between non-adjacent segments
      for (let i = 0; i < segments.length; i++) {
        for (let j = i + 2; j < segments.length; j++) {
          // Skip adjacent segments (they share a point)
          if (i === 0 && j === segments.length - 1) continue;
          
          // Check if segments intersect
          const line1 = turf.lineString(segments[i]);
          const line2 = turf.lineString(segments[j]);
          
          if (turf.booleanIntersects(line1, line2)) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating polygon:', error);
      return false;
    }
  }
}

module.exports = new GeofenceService();