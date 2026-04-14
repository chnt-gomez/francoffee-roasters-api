'use strict';

const sinon = require('sinon');
const { expect } = require('chai');

const MPWebhook = require('#webhooks/MPWebhook');
const webhookEventService = require('#services/webhookEvent.service');
const { handleWebhook } = require('../../src/controllers/mpWebhook.controller.js');

describe('handleWebhook controller', () => {
    let updateByEventIdStub;
    let handlePaymentStub;
    let mockReq;
    let mockRes;

    const eventBody = {
        id: 'evt-001',
        type: 'payment',
        action: 'payment.created',
        data: { id: 'pay-123' }
    };

    beforeEach(() => {
        updateByEventIdStub = sinon.stub(webhookEventService, 'updateByEventId');
        handlePaymentStub = sinon.stub(MPWebhook, 'handlePayment');

        mockRes = {
            status: sinon.stub().returnsThis(),
            send: sinon.stub(),
            json: sinon.stub(),
            headersSent: false
        };

        mockReq = { body: { ...eventBody } };
    });

    afterEach(() => sinon.restore());

    describe('happy path', () => {
        it('should respond 200 OK and trigger background payment handling for payment.created', async () => {
            updateByEventIdStub.resolves();
            handlePaymentStub.resolves();

            await handleWebhook(mockReq, mockRes);

            expect(mockRes.status.calledOnceWith(200)).to.be.true;
            expect(mockRes.send.calledOnceWith('OK')).to.be.true;
            expect(handlePaymentStub.calledOnceWith('evt-001', { id: 'pay-123' })).to.be.true;
        });

        it('should respond 200 OK and trigger background payment handling for payment.updated', async () => {
            mockReq.body.action = 'payment.updated';
            updateByEventIdStub.resolves();
            handlePaymentStub.resolves();

            await handleWebhook(mockReq, mockRes);

            expect(mockRes.status.calledOnceWith(200)).to.be.true;
            expect(mockRes.send.calledOnceWith('OK')).to.be.true;
            expect(handlePaymentStub.calledOnce).to.be.true;
        });

        it('should respond 200 OK and NOT trigger handlePayment for unrecognised actions', async () => {
            mockReq.body.action = 'merchant_order.created';
            updateByEventIdStub.resolves();

            await handleWebhook(mockReq, mockRes);

            expect(mockRes.status.calledOnceWith(200)).to.be.true;
            expect(mockRes.send.calledOnceWith('OK')).to.be.true;
            expect(handlePaymentStub.called).to.be.false;
        });
    });

    describe('error handling', () => {
        it('should return 500 when webhookEventService.updateByEventId rejects', async () => {
            updateByEventIdStub.rejects(new Error('DB connection lost'));

            await handleWebhook(mockReq, mockRes);

            expect(mockRes.status.calledOnceWith(500)).to.be.true;
            expect(mockRes.json.calledOnceWith({ message: 'Internal Server Error' })).to.be.true;
        });

        it('should still respond 200 OK when background handlePayment rejects', async () => {
            updateByEventIdStub.resolves();
            handlePaymentStub.rejects(new Error('MP API down'));

            await handleWebhook(mockReq, mockRes);

            expect(mockRes.status.calledOnceWith(200)).to.be.true;
            expect(mockRes.send.calledOnceWith('OK')).to.be.true;
        });
    });
});
