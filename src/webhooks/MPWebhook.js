const { mpProvider: defaultMpProvider } = require('#clients/paymentProcessor');
const orderService = require('#services/order.service');
const shipmentService = require('#services/shipment.service');
const webhookEventService = require('#services/webhookEvent.service');
const auditLogService = require('#services/auditLog.service');

const handlePayment = async (eventId, data, mpProvider = defaultMpProvider) => {

    try {
        const paymentId = data.id;
        const payment = await mpProvider.lookupPayment(paymentId);
        const { status, external_reference: orderId } = payment;
        const order = await orderService.findById(orderId);

        if (!order) {
            await auditLogService.create({
                event: 'WEBHOOK_ERROR',
                description: `Received payment ${paymentId} for non-existent order ${orderId}`,
                metadata: { paymentId, status, orderId }
            });
            throw new Error(`Order ${orderId} not found.`);
        }

        if (order.paymentStatus === 'paid') {
            await auditLogService.create({
                orderId: order._id,
                event: 'WEBHOOK_IGNORED',
                description: `Duplicate webhook received for payment ${paymentId}. Order already paid.`,
                metadata: { paymentId, status, orderId }
            });
            await webhookEventService.updateByEventId(eventId,
                { status: 'processed' }
            );
            return;
        }

        if (status === 'rejected') {
            await auditLogService.create({
                orderId: order._id,
                event: 'PAYMENT_FAILED',
                description: `Payment ${paymentId} was rejected by provider. Reason: ${status}`,
                metadata: { paymentId, status, orderId }
            });
            await webhookEventService.updateByEventId(eventId,
                { status: 'processed' }
            );
            return;
        }

        if (order.paymentStatus === 'pending' && status === 'approved') {
            await orderService.updateById(order._id, {
                paymentStatus: 'paid',
                mpPaymentId: paymentId.toString()
            });

            await auditLogService.create({
                orderId: order._id,
                event: 'PAYMENT_SUCCESS',
                description: `Payment ${paymentId} approved for order ${orderId}`
            });

            await shipmentService.create({
                orderId: order._id,
                receipientEmail: order.email,
                address: order.deliveryDetails.address,
                location: order.deliveryDetails.location,
                deliveryNotes: order.deliveryDetails.deliveryNotes,
                status: 'accepted'
            });

            await webhookEventService.updateByEventId(eventId,
                { status: 'processed' }
            );
            return;
        }
        await webhookEventService.updateByEventId(eventId, { status: 'processed' });
    } catch (err) {
        await webhookEventService.updateByEventId(eventId,
            { status: 'failed', error: err.message }
        );
        throw err;
    }
}

module.exports = {
    handlePayment
}