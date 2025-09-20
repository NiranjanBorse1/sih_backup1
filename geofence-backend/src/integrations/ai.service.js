const axios = require('axios');

/**
 * AI Service - Integration with the AI Engine module
 */
class AIService {
  constructor() {
  // New Python FastAPI AI engine defaults to port 8001 (user-specified)
  this.baseUrl = process.env.AI_ENGINE_URL || 'http://localhost:8001';
  }
  
  /**
   * Analyze movement pattern for anomaly detection
   * @param {string} touristId - Tourist ID
   * @param {Array} recentCoords - Array of recent coordinates
   * @param {Object} features - Optional features for analysis
   * @returns {Promise<Object>} - Analysis result
   */
  async analyzePattern(touristId, recentCoords, features = {}) {
    try {
      // FastAPI expects `tourist_id` and `recent_coordinates` field names
      const payload = {
        tourist_id: touristId,
        recent_coordinates: recentCoords
      };

      const response = await axios.post(`${this.baseUrl}/ai/analyze`, payload);

      return response.data;
    } catch (error) {
      console.error('Error analyzing pattern:', error.message);
      throw new Error(`Failed to analyze pattern: ${error.message}`);
    }
  }
  
  /**
   * Send zone information to AI Engine for context
   * @param {string} touristId - Tourist ID
   * @param {Object} zoneInfo - Zone information
   * @returns {Promise<Object>} - Response from AI Engine
   */
  async provideZoneContext(touristId, zoneInfo) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/ai/zoneContext`,
        {
          touristId,
          zoneInfo
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error providing zone context:', error.message);
      throw new Error(`Failed to provide zone context: ${error.message}`);
    }
  }
}

module.exports = new AIService();