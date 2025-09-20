const geofenceService = require('../services/geofence.service');
const blockchainService = require('../integrations/blockchain.service');
const alertService = require('../integrations/alert.service');
const twilioService = require('../integrations/twilio.service');

/**
 * Geofence Controller - Handles HTTP requests for geofence operations
 */
class GeofenceController {
  /**
   * Create a new geofence polygon
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createGeofence(req, res, next) {
    try {
      const geofenceData = {
        name: req.body.name,
        description: req.body.description,
        polygon: req.body.polygon,
        zoneType: req.body.zoneType,
        severity: req.body.severity,
        createdBy: req.body.createdBy || req.user?.id || 'system' // From auth middleware or default
      };
      
      const geofence = await geofenceService.createGeofence(geofenceData);
      
      res.status(201).json({
        status: 'success',
        data: {
          geofence
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get all geofences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllGeofences(req, res, next) {
    try {
      const geofences = await geofenceService.getAllGeofences();
      
      res.status(200).json({
        status: 'success',
        results: geofences.length,
        data: {
          geofences
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get a specific geofence by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getGeofence(req, res, next) {
    try {
      const geofence = await geofenceService.getGeofenceById(req.params.id);
      
      res.status(200).json({
        status: 'success',
        data: {
          geofence
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update a geofence
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateGeofence(req, res, next) {
    try {
      const geofence = await geofenceService.updateGeofence(req.params.id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          geofence
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete a geofence (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteGeofence(req, res, next) {
    try {
      await geofenceService.deleteGeofence(req.params.id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Check if coordinates are inside any geofence
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async checkGeofence(req, res, next) {
    try {
      const { touristId, coords } = req.body;
      
      if (!touristId || !coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request: touristId and coordinates (lat, lng) are required'
        });
      }
      
      // Check if point is inside any geofence
      const result = await geofenceService.checkPoint(coords);
      
      // If breach detected, record it and notify integrations
      if (result.breach) {
        // Record the breach event
        const breachEvent = await geofenceService.recordBreachEvent(
          touristId,
          coords,
          result.geofence
        );
        
        try {
          // Log to blockchain (async, don't wait)
          blockchainService.logIncident({
            touristId,
            eventType: 'geofence_breach',
            location: coords,
              geofenceId: result.geofence.id,
            zoneType: result.geofence.zoneType,
            severity: result.geofence.severity,
            timestamp: new Date()
          }).catch(err => {
            console.error('Failed to log incident to blockchain:', err);
          });
          
          // Send alert (async, don't wait)
          alertService.sendAlert({
            touristId,
            alertType: 'geofence_breach',
            location: coords,
            geofenceName: result.geofence.name,
            zoneType: result.geofence.zoneType,
            severity: result.geofence.severity,
            timestamp: new Date()
          }).catch(err => {
            console.error('Failed to send alert:', err);
          });
          
          // Update the breach event with forwarding status
            const updated = await geofenceService.updateBreachEvent(breachEvent.id, {
              forwardedToBlockchain: true,
              alertSent: true,
              processed: true
            });
            // ignore the updated result; it's persisted to the JSON file
        } catch (integrationError) {
          console.error('Integration error:', integrationError);
          // Don't fail the request if integrations fail
        }
      }
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Receive SOS alerts posted by tourist app (legacy endpoint support)
   */
  async receiveSOS(req, res, next) {
    try {
      const data = req.body || {};
      const user = data.user || {};
      const location = data.location || {};

      // Create breach-like event for dashboard consumption
      const breachEvent = await geofenceService.recordBreachEvent(user.digitalId || user.id || 'unknown', { lat: location.lat, lng: location.lng }, {
        id: 'sos', name: 'SOS (manual)', zoneType: 'danger', severity: 'critical'
      });

      // Try forwarding to blockchain (async)
      blockchainService.logIncident({
        touristId: user.digitalId || user.id || 'unknown',
        eventType: 'sos',
        location: { latitude: location.lat, longitude: location.lng },
        severity: 'critical',
        description: `SOS triggered by ${user.name || 'unknown'}`
      }).catch(err => console.error('Failed to log SOS to blockchain:', err));

      // Notify authorities via alert service (async)
      alertService.sendAlert({
        touristId: user.digitalId || user.id || 'unknown',
        alertType: 'SOS_ALERT',
        location: { lat: location.lat, lng: location.lng },
        message: `SOS triggered by ${user.name || 'unknown'}`
      }).catch(err => console.error('Failed to send SOS alert:', err));

      return res.status(200).json({ status: 'success', message: 'SOS received' });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Bulk check multiple points against geofences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async bulkCheckGeofence(req, res, next) {
    try {
      const { checkRequests } = req.body;
      
      if (!Array.isArray(checkRequests) || checkRequests.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request: checkRequests must be a non-empty array'
        });
      }
      
      // Validate each request
      for (const request of checkRequests) {
        if (!request.touristId || 
            !request.coords || 
            typeof request.coords.lat !== 'number' || 
            typeof request.coords.lng !== 'number') {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid request: each item must have touristId and coordinates (lat, lng)'
          });
        }
      }
      
      // Perform bulk check
      const results = await geofenceService.bulkCheckPoints(checkRequests);
      
      // Process breaches (don't wait for completion)
      results.forEach(result => {
        if (result.breach) {
          // Log to blockchain and send alerts (async)
          try {
            blockchainService.logIncident({
              touristId: result.touristId,
              eventType: 'geofence_breach',
              location: checkRequests.find(r => r.touristId === result.touristId).coords,
                geofenceId: result.geofence.id,
              zoneType: result.geofence.zoneType,
              severity: result.geofence.severity,
              timestamp: new Date()
            }).catch(err => {
              console.error(`Failed to log incident to blockchain for tourist ${result.touristId}:`, err);
            });
            
            alertService.sendAlert({
              touristId: result.touristId,
              alertType: 'geofence_breach',
              location: checkRequests.find(r => r.touristId === result.touristId).coords,
              geofenceName: result.geofence.name,
              zoneType: result.geofence.zoneType,
              severity: result.geofence.severity,
              timestamp: new Date()
            }).catch(err => {
              console.error(`Failed to send alert for tourist ${result.touristId}:`, err);
            });
          } catch (integrationError) {
            console.error('Integration error:', integrationError);
            // Don't fail the request if integrations fail
          }
        }
      });
      
      res.status(200).json({
        status: 'success',
        results: results.length,
        data: {
          checkResults: results
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all recorded breach events
   */
  async getBreachEvents(req, res, next) {
    try {
      const events = await geofenceService.getAllBreachEvents();
      res.status(200).json({ status: 'success', results: events.length, data: { breachEvents: events } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update breach event status or fields
   */
  async updateBreachStatus(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = await geofenceService.updateBreachEvent(id, updates);
      res.status(200).json({ status: 'success', data: { breachEvent: updated } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete all persisted geofences (dangerous operation)
   */
  async deleteAllGeofences(req, res, next) {
    try {
      await geofenceService.deleteAllGeofences();
      res.status(200).json({ status: 'success', message: 'All geofences deleted' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send a WhatsApp notification to a phone number (used by authorities)
   */
  async notifyWhatsApp(req, res, next) {
    try {
      const { phone, message } = req.body || {};
      if (!phone || !message) {
        return res.status(400).json({ status: 'error', message: 'phone and message are required' });
      }
      try {
        const result = await twilioService.sendWhatsApp(phone, message);
        return res.status(200).json({ status: 'success', data: result });
      } catch (twErr) {
        console.error('Twilio error:', twErr.message || twErr);
        return res.status(500).json({ status: 'error', message: 'Failed to send WhatsApp message', detail: twErr.message || String(twErr) });
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GeofenceController();