const axios = require('axios');

/**
 * Blockchain Service - Integration with the Blockchain module
 */
class BlockchainService {
  constructor() {
    this.baseUrl = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3001';
  }
  
  /**
   * Log an incident to the blockchain
   * @param {Object} incidentData - Incident data
   * @returns {Promise<Object>} - Response from blockchain service
   */
  async logIncident(incidentData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/blockchain/logIncident`,
        incidentData
      );
      
      return response.data;
    } catch (error) {
      console.error('Error logging incident to blockchain:', error.message);
      throw new Error(`Failed to log incident to blockchain: ${error.message}`);
    }
  }
  
  /**
   * Get tourist DeID information
   * @param {string} touristId - Tourist ID
   * @returns {Promise<Object>} - Tourist DeID information
   */
  async getTouristDeID(touristId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/blockchain/deid/${touristId}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting tourist DeID:', error.message);
      throw new Error(`Failed to get tourist DeID: ${error.message}`);
    }
  }
  
  /**
   * Get incidents for a tourist
   * @param {string} touristId - Tourist ID
   * @returns {Promise<Array>} - List of incidents
   */
  async getIncidentsForTourist(touristId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/blockchain/incidents?touristId=${touristId}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting incidents for tourist:', error.message);
      throw new Error(`Failed to get incidents for tourist: ${error.message}`);
    }
  }
  
  /**
   * Get incidents for a region
   * @param {Object} polygon - GeoJSON polygon of the region
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @returns {Promise<Array>} - List of incidents
   */
  async getIncidentsByRegion(polygon, startTime, endTime) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/blockchain/incidents?region=${JSON.stringify(polygon)}&start=${startTime.toISOString()}&end=${endTime.toISOString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting incidents by region:', error.message);
      throw new Error(`Failed to get incidents by region: ${error.message}`);
    }
  }
}

module.exports = new BlockchainService();