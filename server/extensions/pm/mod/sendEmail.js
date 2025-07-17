const axios = require('axios');
const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = require('../configs/sendgrid');

const sendInviteEmail = async ({ to, link }) => {
  if (!SENDGRID_API_KEY || !to) {
    console.warn('SendGrid not configured or missing recipient');
    return;
  }
  const message = {
    personalizations: [
      {
        to: [{ email: to }],
      },
    ],
    from: { email: SENDGRID_FROM_EMAIL },
    subject: 'Listing approval link',
    content: [
      {
        type: 'text/plain',
        value: `Open this link to manage your listing: ${link}`,
      },
    ],
  };

  await axios.post('https://api.sendgrid.com/v3/mail/send', message, {
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
};

module.exports = { sendInviteEmail };
