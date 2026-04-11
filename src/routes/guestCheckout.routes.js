const { Router } = require('express');

const { guestCheckout } = require('#controllers/guestCheckout.controller');

const router = Router();

router.post('/', guestCheckout);

module.exports = router;