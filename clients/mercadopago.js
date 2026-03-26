import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { 
        timeout: 5000, // 5 seconds timeout for API calls
        idempotencyKey: 'coffee-shop-v1' // Optional: prevents duplicate requests
    } 
});

// We bundle the specific resource clients into a single object
const paymentClient = {
    // Used to create the Checkout Pro "session"
    preferences: new Preference(client),
    
    // Used by the Webhook to verify and fetch payment details
    payments: new Payment(client),
    
    // Raw config in case we need to access other SDK features
    config: client 
};

module.exports = {
    paymentClient
};