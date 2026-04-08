const { response } = require('express');
const { doCheckout } = require('../../events/Checkout');
const CheckoutDTO = require('../../dto/CheckoutDTO');


const guestCheckout = async (req, res = response) => {
    try {
        const checkoutData = new CheckoutDTO(req.body);

        const result = await doCheckout(checkoutData);

        return res.status(201).json({
            ok: true,
            ...result
        });
    } catch (err) {
        console.error('Controller Error:', err);
        return res.status(500).json({
            ok: false,
            msg: 'The checkout process could not be initialized.'
        });
    }
}

module.exports = {
    guestCheckout
}