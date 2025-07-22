const express = require('express');
const authenticatedUser = require('../../common/middlewares/authenticatedUser');
const { getTags, updateTag } = require('../mod/client');
const { finalizeResponse } = require('../../common/response');

const router = express.Router();

router.use(authenticatedUser());

router.get('/tags', async (req, res) => {
  try {
    const email = req.currentUser.attributes.email;
    const tags = await getTags(email);
    finalizeResponse(res)({ data: { tags } });
  } catch (e) {
    console.error('Mailchimp fetch tags failed', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/tag', async (req, res) => {
  try {
    const { tag, active } = req.body;
    const email = req.currentUser.attributes.email;
    await updateTag(email, tag, active);
    finalizeResponse(res)({ status: 200, data: {} });
  } catch (e) {
    console.error('Mailchimp update tag failed', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
