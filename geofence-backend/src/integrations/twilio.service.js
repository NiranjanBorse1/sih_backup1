const Twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // default Twilio sandbox
    if (this.accountSid && this.authToken) {
      this.client = Twilio(this.accountSid, this.authToken);
    } else {
      this.client = null;
    }
  }

  async sendWhatsApp(to, message) {
    if (!this.client) {
      throw new Error('Twilio not configured (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN missing)');
    }
    // Ensure 'to' is in whatsapp:+<number> format
    let toNumber = to;
    if (!to.startsWith('whatsapp:')) toNumber = `whatsapp:${to}`;

    const res = await this.client.messages.create({
      from: this.whatsappFrom,
      to: toNumber,
      body: message
    });

    return res;
  }
}

module.exports = new TwilioService();
