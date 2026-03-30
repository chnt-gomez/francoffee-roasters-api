const { Router } = require ('express');

const { webhook } = require('#controllers/webhook/webhook.controller');
const { validateMpSignature : defaultValidateSignature } = require ("#middleware/validateMPSignature.middleware")

const router = Router();

router.post('/',[validateMpSignature = defaultValidateSignature], webhook);

module.exports = router;