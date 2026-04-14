const orderService = require('#services/order.service');
const auditLogService = require('#services/auditLog.service');
const orderTotalService = require('#services/orderTotal.service');
const { mpProvider: defaultMpProvider } = require('#clients/paymentProcessor');

const doCheckout = async (checkoutDTO, mpProvider = defaultMpProvider) => {

    const { payer, email, orderId, address, location, deliveryNotes } = checkoutDTO;

    const order = await orderService.findById(orderId);

    await auditLogService.create({
        orderId: order._id,
        event: 'ORDER_INITIALIZED',
        description: `Checkout started for ${email}`
    });

    const paymentOrder = await mpProvider.createPaymentOrder(order, payer, email);

    await orderService.updateById(order._id,
        {
            paymentReference: paymentOrder.paymentOrderId,
            statusUpdatedAt: Date.now(),
            deliveryDetails: {
                receipientEmail: email,
                receipientName: payer,
                address: address,
                location: location,
                deliveryNotes: deliveryNotes,
            },
        });

    return {
        paymentOrderId: paymentOrder.paymentOrderId,
        checkoutUrl: paymentOrder.checkoutUrl,
        orderId: order._id
    };

}

module.exports = {
    doCheckout
}