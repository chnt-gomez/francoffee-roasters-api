const { Router } = require ('express');

const { guestCheckout } = require('../../controllers/checkout/guestCheckout.controller');

const router = Router();

router.post('/', guestCheckout);

module.exports = router;