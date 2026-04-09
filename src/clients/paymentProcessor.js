const MercadoPagoProvider = require('#clients/MercadoPagoPaymentProvider');

// You can switch this via .env: PAYMENT_GATEWAY=stripe
const providers = {
    mercadopago: new MercadoPagoProvider(),
};

const paymentProcessor = providers[process.env.PAYMENT_GATEWAY || 'mercadopago'];

module.exports = { paymentProcessor }