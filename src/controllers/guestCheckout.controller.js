const { response } = require('express');
const Checkout = require('#events/Checkout');
const CheckoutDTO = require('#dto/CheckoutDTO');


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
            message: 'The checkout process could not be initialized.'
        });
    }
}

module.exports = {
    guestCheckout
}