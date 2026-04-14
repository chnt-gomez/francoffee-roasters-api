const { Router } = require('express');

const { handleWebhook: defaultHandleWebhook } = require('#controllers/mpWebhook.controller');
const { validateMpSignature: defaultValidateSignature } = require('#middleware/validateMPSignature.middleware');

const createRouter = (
    validateSignature = defaultValidateSignature,
    webhookHandler = defaultHandleWebhook
) => {
    const router = Router();
    router.post('/mercadopago', validateSignature, webhookHandler);
    return router;
};

module.exports = createRouter;