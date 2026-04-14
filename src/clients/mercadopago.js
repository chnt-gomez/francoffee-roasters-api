const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: {
        timeout: 5000, // 5 seconds timeout for API calls
    }
});

// We bundle the specific resource clients into a single object
const paymentClient = {
    payments: new Payment(client),
};

const preferenceClient = {
    preferences: new Preference(client),
}

module.exports = {
    paymentClient,
    preferenceClient
};