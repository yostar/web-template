const axios = require('axios');
const crypto = require('crypto');
const {
  MAILCHIMP_API_KEY,
  MAILCHIMP_SERVER_PREFIX,
  MAILCHIMP_AUDIENCE_ID,
} = require('../common/config');

const baseURL = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;

const axiosInstance = axios.create({
  baseURL,
  headers: {
    Authorization: `apikey ${MAILCHIMP_API_KEY}`,
  },
});

const subscriberHash = (email) =>
  crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

const ensureMember = async (email) => {
  const hash = subscriberHash(email);
  await axiosInstance.put(`/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hash}`, {
    email_address: email,
    status_if_new: 'subscribed',
  });
  return hash;
};

const getTags = async (email) => {
  const hash = await ensureMember(email);
  const res = await axiosInstance.get(`/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hash}/tags`);
  return res.data.tags.map((t) => t.name);
};

const updateTag = async (email, tag, active) => {
  const hash = await ensureMember(email);
  await axiosInstance.post(`/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hash}/tags`, {
    tags: [{ name: tag, status: active ? 'active' : 'inactive' }],
  });
};

module.exports = { getTags, updateTag };
