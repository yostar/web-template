const express = require('express');
const crypto = require('crypto');
const { getTrustedSdk, handleError } = require('../../common/sdk');
const { sendPortalNotification } = require('../utils/notifications');
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
    const listing = listingRes?.data?.data;
    const currentData = listing?.attributes?.publicData || {};
    const ownerId = listing?.relationships?.author?.data?.id?.uuid;

    const currentUserRes = await trustedSdk.currentUser.show();
    const currentUserId = currentUserRes?.data?.data?.id?.uuid;

    if (ownerId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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

    await sendPortalNotification({ email, phone, portalUrl });

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
    const listing = listingRes?.data?.data;
    const publicData = listing?.attributes?.publicData || {};
    const ownerId = listing?.relationships?.author?.data?.id?.uuid;

    const currentUserRes = await trustedSdk.currentUser.show();
    const currentUserId = currentUserRes?.data?.data?.id?.uuid;

    if (ownerId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
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

    await sendPortalNotification({ email, phone, portalUrl });

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
