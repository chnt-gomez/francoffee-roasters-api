const BasePaymentProvider = require('#clients/BasePaymentProvider');
const { preferenceClient, paymentClient } = require("./mercadopago");

class MercadoPagoProvider extends BasePaymentProvider {
    constructor() {
        super('MercadoPago');
    }

    async createPaymentOrder(order) {
        const orderReference = order._id.toString()
        const response = await preferenceClient.preferences.create({
            body: {
                items: [{
                    id: orderReference,
                    title: 'Venta al público en general',
                    description: 'Compra en FranCoffee Roasters',
                    quantity: 1,
                    unit_price: Number(order.totalAmount), // Use the pre-calculated total (Subtotal + Tax)
                    currency_id: 'MXN'
                }],
                payer: {
                    name: order.payer,
                    email: order.email,
                },
                external_reference: orderReference,
                binary_mode: true,
                back_urls: {
                    success: `localhost:5173/checkout/success`,
                    failure: `localhost:5173/checkout/error`,
                },
                auto_return: "approved",
                payment_methods: {
                    excluded_payment_types: [
                        { id: "ticket" },        // Excludes OXXO, 7-Eleven, etc.
                        { id: "bank_transfer" }, // Excludes SPEI / Bank transfers
                        { id: "atm" }            // Excludes ATM payments
                    ],
                    installments: 1,             // Maximum number of installments allowed
                    default_installments: 1      // Pre-selects 1 installment
                },
            },
            options: {
                idempotencyKey: orderReference
            }
        });

        return {
            ...response,
            paymentOrderId: response.id,
            checkoutUrl: process.env.ENV === 'prod' ? response.init_point : response.sandbox_init_point
        }
    }

    async lookupPayment(paymentId) {
        return await paymentClient.payments.get({ id: paymentId });
    }
}

module.exports = MercadoPagoProvider;