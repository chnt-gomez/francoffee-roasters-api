const { response } = require('express');
const MPWebhook = require('#webhooks/MPWebhook');
const webhookEventService = require('#services/webhookEvent.service')

const handleWebhook = async (req, res = response) => {

    try {
        const eventData = req.body;
        const { id, type, action, data } = eventData;

        await webhookEventService.updateByEventId(id,
            { type, action, data, status: 'pending' },
            { upsert: true, new: true }
        )

        res.status(200).send('OK');

        if (
            action === 'payment.created' ||
            action === 'payment.updated') {
            MPWebhook.handlePayment(id, data).catch(
                err => {
                    //console.error(`Failed background processing for ${id}:`, err);
                }
            )
        }
    } catch (err) {
        console.error('Webhook save error:', err);
        // Only return 500 if we FAILED to save it to our database.
        // This forces MP to retry later so we don't lose the data.
        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

module.exports = {
    handleWebhook
}
