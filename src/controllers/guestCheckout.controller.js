const { response } = require('express');
const Checkout = require('#events/Checkout');
const PreCheckout = require('#events/PreCheckout');
const CheckoutDTO = require('#dto/CheckoutDTO');
const PreCheckoutDTO = require('#dto/PreCheckoutDTO');


const guestCheckout = async (req, res = response) => {
    try {
        const checkoutData = new CheckoutDTO(req.body);

        const result = await Checkout.doCheckout(checkoutData);

        return res.status(201).json({
            message: 'Payment order created',
            ...result
        });
    } catch (err) {
        return res.status(500).json({
            message: 'The checkout process could not be initialized.',
            error: err
        });
    }
}

const preCheckout = async (req, res = response) => {

    const preCheckoutData = new PreCheckoutDTO(req.body);

    try {
        const result = await PreCheckout.doPreCheckout(preCheckoutData);

        return res.status(201).json({
            'message': 'Pre-Checkout started',
            ...result
        });
    } catch (err) {
        return res.status(400).json({
            message: 'Pre-checkout process failed.',
            error: err.message
        });
    }

}

module.exports = {
    guestCheckout,
    preCheckout
}