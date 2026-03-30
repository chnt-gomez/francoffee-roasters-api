const Order = require('../schema/orderSchema');
const AuditLog = require ('../schema/auditLogSchema');

const {paymentClient : defaultPaymentClient } = require ('../clients/mercadopago');

const doCheckout = async(checkoutDTO, paymentClient= defaultPaymentClient) => {

    const {payer, email, items, totalAmount, address, location, deliveryNotes} = checkoutDTO;
    const order = new Order({
        email,
        items,
        totalAmount,
        paymentStatus: 'pending',
        deliveryDetails: {
            receipientEmail: email,
            receipientName: payer,
            address,
            location,
            deliveryNotes
        }
    });

    order.externalReference = order._id.toString();

    await order.save();

    await AuditLog.create({
        orderId: order._id,
        event: 'ORDER_INITIALIZED',
        description: `Checkout started for ${email}`
    });

    const mpPreference = await paymentClient.preferences.create({
        body: {
            items: items.map((i, index) => ({ 
                id: i.productId || i._id || `COFFEE-ITEM-${index}`,
                title: i.title,
                description: i.title,
                quantity: Number(i.quantity),
                unit_price: Number(i.unit_price),
                currency_id: 'MXN'
            })),
            payer: {
                name: payer,
                email:email,           
            },
            external_reference: order.externalReference,
            binary_mode: true,
            back_urls: {
                success: `${process.env.FRONTEND_URL}/success`,
                failure: `${process.env.FRONTEND_URL}/error`,
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
            idempotencyKey: order._id.toString()
        }
    });

    order.mpPreferenceId = mpPreference.id;

    await order.save();

    let initPoint = process.env.ENV === 'prod' ? mpPreference.init_point : mpPreference.sandbox_init_point;

    return {
        preferenceId: mpPreference.id,
        initPoint,
        orderId: order._id
    };

}

module.exports = {
    doCheckout
}