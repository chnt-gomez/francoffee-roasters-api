const Order = require('#schema/orderSchema');
const AuditLog = require('#schema/auditLogSchema');
const CheckoutDTO = require('#dto/CheckoutDTO')
const { paymentProcessor: defaultPaymentProcessor } = require('#clients/paymentProcessor');

const doCheckout = async (requestBody, paymentProcessor = defaultPaymentProcessor) => {

    const checkoutDTO = new CheckoutDTO(requestBody);

    const { payer, phone, email, items, address, location, deliveryNotes } = checkoutDTO;

    const total = 460;

    const order = new Order({
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

    await order.save();

    await AuditLog.create({
        orderId: order._id,
        event: 'ORDER_INITIALIZED',
        description: `Checkout started for ${email}`
    });

    const paymentOrder = await paymentProcessor.createPaymentOrder(order);

    console.log(paymentOrder);


    //order.externalReference = paymentOrder.id;

    //await order.save();

    return {
        paymentOrderId: paymentOrder.paymentOrderId,
        checkoutUrl: paymentOrder.checkoutUrl,
        orderId: order._id
    };

}

module.exports = {
    doCheckout
}