const crypto = require ('crypto');
const AuditLog = require ('#schema/auditLogSchema');

const validateMpSignature = async(req, res, next) => {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];

    if (!xSignature || !xRequestId) {
        return res.status(401).json({
            message: 'Missing security headers or secret'
        });
        
    }

    const secret = process.env.MP_WEBHOOK_SECRET;
    try {

        const parts = xSignature.split(',');
        const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
        const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

        if (!ts || !v1) throw new Error('Invalid signature format');

        const dataId = req.query['data.id'] || req.body?.data?.id;

        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(manifest);
        const generatedHash = hmac.digest('hex');

        if (generatedHash !== v1) {
            await AuditLog.create({
                event: 'SECURITY_ALERT',
                description: 'Invalid Webhook Signature detected',
                metadata: { ip: req.ip, dataId }
            });
            return res.status(401).json({ message: 'Invalid signature' });
        }

        next();

    } catch (err) {
        console.error('Signature Validation Error:', err.message);
        return res.status(401).json({ message: 'Authentication failed' });
    }
};

module.exports = { validateMpSignature }