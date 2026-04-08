const { paymentClient: defaultPaymentClient } = require('#clients/mercadopago');
const Order = require('#schema/orderSchema');
const Shipment = require('#schema/shipmentSchema');
const AuditLog = require('#schema/auditLogSchema');

const handleWebhook = async (paymentId, paymentClient = defaultPaymentClient) => {
    
    const payment = await(paymentClient.payments.get({ id: paymentId}));
    const { status, external_reference: orderId } = payment;
    const order = await Order.findById(orderId);

    if (!order){
        await AuditLog.create({
            event: 'WEBHOOK_ERROR',
            description: `Received payment ${paymentId} for non-existent order ${orderId}`,
            metadata: { paymentId, status, orderId }
        });
        return { message: 'Order not found'};
    }

    if (order.paymentStatus === 'paid') {
        await AuditLog.create({
            orderId: order._id,
            event: 'WEBHOOK_IGNORED',
            description: `Duplicate webhook received for payment ${paymentId}. Order already paid.`,
            metadata: { paymentId, status }
        });
        return { message: 'Order already processed' };
    }

    if (status === 'rejected') {
        await AuditLog.create({
            orderId: order._id,
            event: 'PAYMENT_FAILED',
            description: `Payment ${paymentId} was rejected by provider. Reason: ${status}`,
            metadata: { paymentId, status }
        });
        return {
            message: 'Payment failed. No shipment was created'
        }
    }

    // Only accept if
    if (order.paymentStatus === 'pending' && status==='approved') {
        order.paymentStatus = 'paid';
        order.mpPaymentId = paymentId.toString();
        await order.save();
    
        const shipment = new Shipment({
            orderId: order._id,
            receipientEmail: order.email,
            address: order.deliveryDetails.address,
            location: order.deliveryDetails.location,
            deliveryNotes: order.deliveryDetails.deliveryNotes,
            status: 'accepted'
        });

        await shipment.save();

        await AuditLog.create({
            orderId: order._id,
            event: 'PAYMENT_SUCCESS',
            description: `Payment ${paymentId} approved for order ${orderId}`
        });

        return {
            message: 'Shipment created',
            ...shipment,

        }

    }
};

module.exports = { handleWebhook }