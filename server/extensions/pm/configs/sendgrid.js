const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';

module.exports = { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL };
