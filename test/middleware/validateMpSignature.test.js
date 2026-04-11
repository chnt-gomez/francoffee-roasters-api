const sinon = require('sinon');
const { expect } = require('chai');
const crypto = require('crypto');

const { validateMpSignature } = require('#middleware/validateMPSignature.middleware');
const auditLogService = require('#services/auditLog.service');

describe('Middleware: validateMpSignature', () => {
    let sandbox;
    let req, res, next;
    const SECRET = 'test_secret_123';

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        process.env.MP_WEBHOOK_SECRET = SECRET;

        req = {
            headers: {},
            query: {},
            body: {},
            ip: '127.0.0.1'
        };
        res = {
            status: sandbox.stub().returnsThis(),
            json: sandbox.stub().returnsThis()
        };
        next = sandbox.spy();

        sandbox.stub(auditLogService, 'create').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should call next() when signature is valid', async () => {
        const dataId = '12345';
        const requestId = 'req-001';
        const ts = Math.floor(Date.now() / 1000).toString();

        // Generate a valid signature for the test
        const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
        const v1 = crypto.createHmac('sha256', SECRET).update(manifest).digest('hex');

        req.headers['x-signature'] = `ts=${ts},v1=${v1}`;
        req.headers['x-request-id'] = requestId;
        req.body = { data: { id: dataId } };

        await validateMpSignature(req, res, next);

        expect(next.calledOnce).to.be.true;
        expect(res.status.called).to.be.false;
    });

    it('should return 401 and log security alert when signature is invalid', async () => {
        req.headers['x-signature'] = 'ts=123,v1=wronghash';
        req.headers['x-request-id'] = 'req-001';
        req.body = { data: { id: '12345' } };

        await validateMpSignature(req, res, next);

        expect(next.called).to.be.false;
        expect(res.status.calledWith(401)).to.be.true;
        expect(auditLogService.create.calledOnceWith(sinon.match({ event: 'SECURITY_ALERT' }))).to.be.true;
    });

    it('should return 401 if security headers are missing', async () => {
        // req.headers is empty
        await validateMpSignature(req, res, next);

        expect(res.status.calledWith(401)).to.be.true;
        expect(next.called).to.be.false;
    });
});