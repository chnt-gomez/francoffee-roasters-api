const orderService = require('#services/order.service');
const auditLogService = require('#services/auditLog.service');
const orderTotalService = require('#services/orderTotal.service');
const { mpProvider: defaultMpProvider } = require('#clients/paymentProcessor');

const doCheckout = async (checkoutDTO, mpProvider = defaultMpProvider) => {

    const { payer, phone, email, items, address, location, deliveryNotes } = checkoutDTO;

    //The service is returning a static number for now. We will implement this behavior when we have an items schema in the database
    const total = orderTotalService.calculateTotal(items);

    const order = await orderService.create({
        email,
        phone,
        items,
        totalAmount: total,
        paymentStatus: 'pending',
        deliveryDetails: {
            receipientEmail: email,
            receipientName: payer,
            address,
            location,
            deliveryNotes
        },
        totalAmount: total,
    });

    await auditLogService.create({
        orderId: order._id,
        event: 'ORDER_INITIALIZED',
        description: `Checkout started for ${email}`
    });

    const paymentOrder = await mpProvider.createPaymentOrder(order);

    await orderService.updateById(order._id, { paymentReference: paymentOrder.paymentOrderId });

    return {
        paymentOrderId: paymentOrder.paymentOrderId,
        checkoutUrl: paymentOrder.checkoutUrl,
        orderId: order._id
    };

}

module.exports = {
    doCheckout
}