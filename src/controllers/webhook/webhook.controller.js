const { response } = require('express');
const { handleWebhook } = require('#events/Webhook');

const webhook = async (req, res = response) => {
    try {
        const { action, data } = req.body;

        if (action === 'payment.created' || 'payment.updated') {
            await handleWebhook(data.id);
        }

        res.status(200).send('OK');
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
};

module.exports = {
    webhook
}
