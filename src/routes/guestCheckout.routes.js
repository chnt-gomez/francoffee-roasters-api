const { Router } = require('express');

const { guestCheckout, preCheckout } = require('#controllers/guestCheckout.controller');

const router = Router();

router.post('/apply', guestCheckout);
router.post('/pre', preCheckout)

module.exports = router;