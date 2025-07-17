const axios = require('axios');
const { OPENPHONE_API_KEY, OPENPHONE_FROM_NUMBER } = require('../configs/openphone');

const sendInviteSms = async ({ to, link }) => {
  if (!OPENPHONE_API_KEY || !OPENPHONE_FROM_NUMBER || !to) {
    console.warn('OpenPhone not configured or missing recipient');
    return;
  }
  const message = {
    from: OPENPHONE_FROM_NUMBER,
    to,
    text: `Open this link to manage your listing: ${link}`,
  };
  await axios.post('https://api.openphone.com/v1/messages', message, {
    headers: {
      Authorization: `Bearer ${OPENPHONE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
};

module.exports = { sendInviteSms };
