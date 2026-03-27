const Order = require('../schema/orderSchema');
const Shipment = require ('../schema/shipmentSchema');
const AuditLog = require ('../schema/auditLogSchema');

const {paymentClient : defaultPaymentClient } = require ('../clients/mercadopago');

const doCheckout = async(checkoutDTO, paymentClient= defaultPaymentClient) => {

    const {payer, email, items, totalAmount, address, location, deliveryNotes} = checkoutDTO;
    const order = new Order({
        email,
        items,
        totalAmount,
        paymentStatus: 'pending'
    });

    order.externalReference = order._id.toString();

    const shipment = new Shipment({
        orderId: order._id,
        receipientEmail: email,
        address,
        location,
        deliveryNotes,
        status: 'pending_payment'
    });

    await order.save();
    await shipment.save();
    await AuditLog.create({
        orderId: order._id,
        event: 'ORDER_INITIALIZED',
        description: `Checkout started for ${email}`
    });

    const mpPreference = await paymentClient.preferences.create({
        body: {
            items: items.map(i => ({ ...i, currency_id: 'MXN'})),
            payer,
            external_reference: order.externalReference,
            binary_mode: true,
            back_urls: {
                success: `${process.env.FRONTEND_URL}/success`,
                failure: `${process.env.FRONTEND_URL}/error`,
            },
            auto_return: "approved"
        }
    });

    order.mpPreferenceId = mpPreference.id;

    await order.save();

    return {
        preferenceId: mpPreference.id,
        initPoint: mpPreference.init_point,
        orderId: order._id
    };

}

module.exports = {
    doCheckout
}