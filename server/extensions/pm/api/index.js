const express = require('express');
const crypto = require('crypto');
const { integrationSdk, handleError } = require('../../common/sdk');
const { sendInviteEmail } = require('../mod/sendEmail');
const { sendInviteSms } = require('../mod/sendSms');
const router = express.Router();

const ROOT_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL.replace(/\/$/, '');


// POST /api/pm/invite - send invite to property manager
router.post('/invite', async (req, res) => {
  const { listingId, pmEmail, pmPhone } = req.body || {};
  if (!listingId) {
    return res.status(400).json({ error: 'Missing listingId' });
  }

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await integrationSdk.listings.update({
      id: listingId,
      publicData: { pmStatus: 'pending' },
      privateData: { pmApproveToken: token, pmTokenExpiresAt: expiresAt },
    });

    const link = `${ROOT_URL}/pm/portal?listingId=${listingId}&token=${token}`;

    if (pmEmail) {
      await sendInviteEmail({ to: pmEmail, link });
    }
    if (pmPhone) {
      await sendInviteSms({ to: pmPhone, link });
    }

    res.status(200).json({ success: true });
  } catch (e) {
    handleError(res, e);
  }
});

router.post('/auth', async (req, res) => {
  const { listingId, token } = req.body || {};
  if (!listingId || !token) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const response = await integrationSdk.listings.show({ id: listingId });
    const attrs = response.data.data.attributes;
    const { pmApproveToken, pmTokenExpiresAt } = attrs.privateData || {};

    if (
      token !== pmApproveToken ||
      (pmTokenExpiresAt && new Date(pmTokenExpiresAt) < new Date())
    ) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const pmStatus = attrs.publicData?.pmStatus || 'pending';

    res.status(200).json({ valid: true, pmStatus });
  } catch (e) {
    handleError(res, e);
  }
});

router.post('/approve', async (req, res) => {
  const { listingId, token } = req.body || {};
  if (!listingId || !token) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const listing = await integrationSdk.listings.show({ id: listingId });
    const attrs = listing.data.data.attributes;
    const { pmApproveToken, pmTokenExpiresAt } = attrs.privateData || {};

    if (
      token !== pmApproveToken ||
      (pmTokenExpiresAt && new Date(pmTokenExpiresAt) < new Date())
    ) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    await integrationSdk.listings.approve({ id: listingId });
    await integrationSdk.listings.update({
      id: listingId,
      publicData: { pmStatus: 'approved' },
    });

    res.status(200).json({ success: true });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /api/pm/status/:listingId - return pmStatus from listing publicData
router.get('/status/:listingId', async (req, res) => {
  const { listingId } = req.params;
  try {
    const response = await integrationSdk.listings.show({ id: listingId });
    const pmStatus = response?.data?.data?.attributes?.publicData?.pmStatus || 'pending';
    res.status(200).json({ pmStatus });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
