const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { getTrustedSdk, handleError } = require('../../common/sdk');
const router = express.Router();

// POST /api/pm/invite - send invite to property manager
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

router.post('/invite', async (req, res) => {
  const { listingId, email, phone } = req.body || {};

  if (!listingId) {
    return res.status(400).json({ error: 'Missing listingId' });
  }

  try {
    const trustedSdk = await getTrustedSdk(req);
    const token = crypto.randomBytes(20).toString('hex');

    const listingRes = await trustedSdk.listings.show({ id: listingId });
    const currentData = listingRes?.data?.data?.attributes?.publicData || {};

    await trustedSdk.listings.update({
      id: listingId,
      publicData: {
        ...currentData,
        pmApproveToken: token,
        pmStatus: currentData.pmStatus || 'pending',
        pmPortalState: 'sent',
        pmTokenCreatedAt: new Date().toISOString(),
        pmContact: { email: email || currentData?.pmContact?.email, phone: phone || currentData?.pmContact?.phone },
      },
    });

    const portalUrl = `${process.env.REACT_APP_MARKETPLACE_ROOT_URL}/pm/portal?listingId=${listingId}&token=${token}`;

    if (process.env.SENDGRID_API_KEY && email) {
      await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email }] }],
          from: { email: 'no-reply@example.com' },
          subject: 'Property manager portal',
          content: [
            {
              type: 'text/plain',
              value: `Open the portal: ${portalUrl}`,
            },
          ],
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

    res.status(200).json({ success: true });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /api/pm/invite-status/:listingId - return invite state
router.get('/invite-status/:listingId', async (req, res) => {
  const { listingId } = req.params;

  try {
    const trustedSdk = await getTrustedSdk(req);
    const response = await trustedSdk.listings.show({ id: listingId });
    const publicData = response?.data?.data?.attributes?.publicData || {};

    let inviteStatus = publicData.pmPortalState || 'notSent';
    const created = new Date(publicData.pmTokenCreatedAt || 0).getTime();
    if (
      inviteStatus !== 'opened' &&
      created &&
      Date.now() - created > TOKEN_EXPIRY_MS
    ) {
      inviteStatus = 'expired';
      await trustedSdk.listings.update({
        id: listingId,
        publicData: { pmPortalState: 'expired' },
      });
    }

    res.status(200).json({ inviteStatus });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/pm/invite/resend - resend portal invite using stored contact
router.post('/invite/resend', async (req, res) => {
  const { listingId } = req.body || {};

  if (!listingId) {
    return res.status(400).json({ error: 'Missing listingId' });
  }

  try {
    const trustedSdk = await getTrustedSdk(req);
    const listingRes = await trustedSdk.listings.show({ id: listingId });
    const publicData = listingRes?.data?.data?.attributes?.publicData || {};
    const contact = publicData.pmContact || {};
    const { email, phone } = contact;

    if (!email && !phone) {
      return res.status(400).json({ error: 'No contact info' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    await trustedSdk.listings.update({
      id: listingId,
      publicData: {
        ...publicData,
        pmApproveToken: token,
        pmPortalState: 'sent',
        pmTokenCreatedAt: new Date().toISOString(),
      },
    });

    const portalUrl = `${process.env.REACT_APP_MARKETPLACE_ROOT_URL}/pm/portal?listingId=${listingId}&token=${token}`;

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

    res.status(200).json({ success: true });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /api/pm/status/:listingId - return pmStatus from listing publicData
router.get('/status/:listingId', async (req, res) => {
  const { listingId } = req.params;
  const { token } = req.query;

  try {
    const trustedSdk = await getTrustedSdk(req);
    const response = await trustedSdk.listings.show({ id: listingId });
    const publicData = response?.data?.data?.attributes?.publicData || {};

    if (token) {
      if (token !== publicData.pmApproveToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const created = new Date(publicData.pmTokenCreatedAt || 0).getTime();
      if (Date.now() - created > TOKEN_EXPIRY_MS) {
        await trustedSdk.listings.update({
          id: listingId,
          publicData: { pmPortalState: 'expired' },
        });
        return res.status(410).json({ error: 'Token expired' });
      }

      if (publicData.pmPortalState !== 'opened') {
        await trustedSdk.listings.update({
          id: listingId,
          publicData: { pmPortalState: 'opened' },
        });
      }
    }

    const pmStatus = publicData.pmStatus || 'pending';
    res.status(200).json({ pmStatus });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/pm/approve - verify token and approve listing
router.post('/approve', async (req, res) => {
  const { listingId, token } = req.body || {};

  if (!listingId || !token) {
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    const trustedSdk = await getTrustedSdk(req);
    const response = await trustedSdk.listings.show({ id: listingId });
    const publicData = response?.data?.data?.attributes?.publicData || {};

    if (token !== publicData.pmApproveToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await trustedSdk.listings.approve({ id: listingId });
    await trustedSdk.listings.update({
      id: listingId,
      publicData: { pmStatus: 'approved', pmPortalState: 'opened' },
    });

    res.status(200).json({ success: true });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
