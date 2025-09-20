const axios = require('axios');

/**
 * Alert Service - Integration with the Alert System module
 */
class AlertService {
  constructor() {
    this.baseUrl = process.env.ALERT_SYSTEM_URL || 'http://localhost:3004';
  }
  
  /**
   * Send an alert when a breach is detected
   * @param {Object} alertData - Alert data
   * @returns {Promise<Object>} - Response from alert service
   */
  async sendAlert(alertData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/alerts/send`,
        alertData
      );
      
      return response.data;
    } catch (error) {
      console.error('Error sending alert:', error.message);
      throw new Error(`Failed to send alert: ${error.message}`);
    }
  }
  
  /**
   * Get status of a previously sent alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<Object>} - Alert status
   */
  async getAlertStatus(alertId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/alerts/status/${alertId}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting alert status:', error.message);
      throw new Error(`Failed to get alert status: ${error.message}`);
    }
  }
  
  /**
   * Notify authority about a breach
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Response from alert service
   */
  async notifyAuthority(notificationData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/alerts/notify-authority`,
        notificationData
      );
      
      return response.data;
    } catch (error) {
      console.error('Error notifying authority:', error.message);
      throw new Error(`Failed to notify authority: ${error.message}`);
    }
  }
}

module.exports = new AlertService();