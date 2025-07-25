const axios = require('axios');

/**
 * Send portal URL to property manager via email and/or SMS.
 * @param {Object} params
 * @param {string} [params.email] - Email address to send the portal link to.
 * @param {string} [params.phone] - Phone number to send the SMS to.
 * @param {string} params.portalUrl - URL to include in the message body.
 */
const sendPortalNotification = async ({ email, phone, portalUrl }) => {
  if (process.env.SENDGRID_API_KEY && email) {
    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{ to: [{ email }] }],
        from: { email: 'no-reply@example.com' },
        subject: 'Property manager portal',
        content: [{ type: 'text/plain', value: `Open the portal: ${portalUrl}` }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (process.env.OPENPHONE_API_KEY && phone) {
    await axios.post(
      'https://api.openphone.com/v1/messages',
      { to: phone, text: portalUrl },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENPHONE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

module.exports = { sendPortalNotification };
