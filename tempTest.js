const { MercadoPagoConfig, PaymentMethod, Preference} = require('mercadopago');

const client = new MercadoPagoConfig({
    accessToken: ''
});

async function testConnection() {
    try {
        const paymentMethod = new PaymentMethod(client);
        const methods = await paymentMethod.get();

        console.log("Connection successful!");
        console.log(`Account supports: ${methods.length} payment methods in Mexico`);
    } catch (error) {
        console.log('Connection failed. Wrong credentials');
        console.log(error);
    }
}


async function testPreference() {
    const preference = new Preference(client);
    const result = await preference.create({
        body: {
            items: [{
                title: 'Prueba Cafe MVP',
                quantity: 1,
                unit_price: 10.50,
                currency_id: 'MXN',
            }],
            back_urls: {
                success: "https://google.com",
            },
            auto_return:"approved"
        }
    });

    console.log("-----------------------------------------");
  console.log("🔗 TEST PAYMENT LINK:");
  console.log(result.sandbox_init_point); // Use the SANDBOX link
  console.log("-----------------------------------------");
}
testPreference();