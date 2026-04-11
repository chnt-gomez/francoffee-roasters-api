const MercadoPagoProvider = require('#clients/MercadoPagoPaymentProvider');

// You can switch this via .env: PAYMENT_GATEWAY=stripe

const providers = {
    mercadopago: new MercadoPagoProvider(),
};

const mpProvider = providers['mercadopago'];

module.exports = { mpProvider }