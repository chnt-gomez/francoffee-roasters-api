'use strict';

const sinon = require('sinon');
const { expect } = require('chai');

const orderService = require('#services/order.service');
const shipmentService = require('#services/shipment.service');
const webhookEventService = require('#services/webhookEvent.service');
const auditLogService = require('#services/auditLog.service');
const { handlePayment } = require('#webhooks/MPWebhook');

describe('handlePayment webhook', () => {
    let orderFindByIdStub;
    let orderUpdateByIdStub;
    let shipmentCreateStub;
    let webhookEventUpdateStub;
    let auditLogCreateStub;
    let mockMpProvider;
    let mockOrder;

    const EVENT_ID = 'evt-001';
    const PAYMENT_ID = 'pay-123';
    const ORDER_ID = 'order-abc';

    const buildMockOrder = (paymentStatus = 'pending') => ({
        _id: ORDER_ID,
        email: 'test@test.com',
        paymentStatus,
        deliveryDetails: {
            address: 'Puebla Centro',
            location: { type: 'Point', coordinates: [-98, 19] },
            deliveryNotes: 'Leave at gate'
        }
    });

    beforeEach(() => {
        mockOrder = buildMockOrder('pending');

        orderFindByIdStub = sinon.stub(orderService, 'findById').resolves(mockOrder);
        orderUpdateByIdStub = sinon.stub(orderService, 'updateById').resolves();
        shipmentCreateStub = sinon.stub(shipmentService, 'create').resolves();
        webhookEventUpdateStub = sinon.stub(webhookEventService, 'updateByEventId').resolves();
        auditLogCreateStub = sinon.stub(auditLogService, 'create').resolves();

        mockMpProvider = {
            lookupPayment: sinon.stub().resolves({
                status: 'approved',
                external_reference: ORDER_ID
            })
        };
    });

    afterEach(() => sinon.restore());

    // ─── APPROVED ────────────────────────────────────────────────────────────

    describe('when payment is approved', () => {
        it('should mark the webhookEvent as processed', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(webhookEventUpdateStub.calledOnceWith(EVENT_ID, { status: 'processed' })).to.be.true;
        });

        it('should update the order with paymentStatus paid and the mpPaymentId', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(orderUpdateByIdStub.calledOnceWith(ORDER_ID, {
                paymentStatus: 'paid',
                mpPaymentId: PAYMENT_ID
            })).to.be.true;
        });

        it('should log a PAYMENT_SUCCESS audit entry', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(auditLogCreateStub.calledOnceWith(sinon.match({
                orderId: ORDER_ID,
                event: 'PAYMENT_SUCCESS'
            }))).to.be.true;
        });

        it('should create a shipment with the order delivery details', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(shipmentCreateStub.calledOnceWith(sinon.match({
                orderId: ORDER_ID,
                receipientEmail: mockOrder.email,
                address: mockOrder.deliveryDetails.address,
                status: 'accepted'
            }))).to.be.true;
        });
    });

    // ─── ERROR: APPROVED PATH PARTIAL FAILURES ───────────────────────────────

    describe('when orderService.updateById fails in the approved path', () => {
        beforeEach(() => {
            orderUpdateByIdStub.rejects(new Error('DB write failed'));
        });

        it('should mark the webhookEvent as failed', async () => {
            try { await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider); } catch (_) {}

            expect(webhookEventUpdateStub.calledOnceWith(EVENT_ID, {
                status: 'failed',
                error: 'DB write failed'
            })).to.be.true;
        });

        it('should not create a shipment', async () => {
            try { await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider); } catch (_) {}

            expect(shipmentCreateStub.called).to.be.false;
        });
    });

    describe('when auditLogService.create fails after orderService.updateById succeeds in the approved path', () => {
        // Hidden scenario: order IS persisted as paid but the event ends up as failed
        // and no shipment is created because the error aborts the rest of the chain.
        beforeEach(() => {
            auditLogCreateStub.rejects(new Error('Audit log unavailable'));
        });

        it('should mark the webhookEvent as failed', async () => {
            try { await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider); } catch (_) {}

            expect(webhookEventUpdateStub.calledOnceWith(EVENT_ID, {
                status: 'failed',
                error: 'Audit log unavailable'
            })).to.be.true;
        });

        it('should not create a shipment even though the order was already updated to paid', async () => {
            try { await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider); } catch (_) {}

            expect(orderUpdateByIdStub.calledOnce).to.be.true; // order WAS updated
            expect(shipmentCreateStub.called).to.be.false;     // but shipment was NOT created
        });
    });

    // ─── DUPLICATE WEBHOOK ───────────────────────────────────────────────────

    describe('when the order is already paid (duplicate webhook)', () => {
        beforeEach(() => {
            mockOrder = buildMockOrder('paid');
            orderFindByIdStub.resolves(mockOrder);
        });

        it('should mark the webhookEvent as processed', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(webhookEventUpdateStub.calledOnceWith(EVENT_ID, { status: 'processed' })).to.be.true;
        });

        it('should log a WEBHOOK_IGNORED audit entry', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(auditLogCreateStub.calledOnceWith(sinon.match({ event: 'WEBHOOK_IGNORED' }))).to.be.true;
        });

        it('should not update the order or create a shipment', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(orderUpdateByIdStub.called).to.be.false;
            expect(shipmentCreateStub.called).to.be.false;
        });
    });

    // ─── PAYMENT REJECTED ────────────────────────────────────────────────────

    describe('when the payment is rejected', () => {
        beforeEach(() => {
            mockMpProvider.lookupPayment.resolves({ status: 'rejected', external_reference: ORDER_ID });
        });

        it('should mark the webhookEvent as processed', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(webhookEventUpdateStub.calledOnceWith(EVENT_ID, { status: 'processed' })).to.be.true;
        });

        it('should log a PAYMENT_FAILED audit entry', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(auditLogCreateStub.calledOnceWith(sinon.match({ event: 'PAYMENT_FAILED' }))).to.be.true;
        });

        it('should not update the order or create a shipment', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(orderUpdateByIdStub.called).to.be.false;
            expect(shipmentCreateStub.called).to.be.false;
        });
    });

    // ─── UNRECOGNISED STATUS (FALLTHROUGH) ───────────────────────────────────

    describe('when the payment status is unrecognised (fallthrough)', () => {
        beforeEach(() => {
            mockMpProvider.lookupPayment.resolves({ status: 'in_process', external_reference: ORDER_ID });
        });

        it('should still mark the webhookEvent as processed', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(webhookEventUpdateStub.calledOnceWith(EVENT_ID, { status: 'processed' })).to.be.true;
        });

        it('should not update the order or create a shipment', async () => {
            await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);

            expect(orderUpdateByIdStub.called).to.be.false;
            expect(shipmentCreateStub.called).to.be.false;
        });
    });

    // ─── ERROR: ORDER NOT FOUND ───────────────────────────────────────────────

    describe('when the order is not found', () => {
        beforeEach(() => {
            orderFindByIdStub.resolves(null);
        });

        it('should mark the webhookEvent as failed with the error message', async () => {
            try { await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider); } catch (_) {}

            expect(webhookEventUpdateStub.calledOnceWith(EVENT_ID, sinon.match({
                status: 'failed',
                error: sinon.match.string
            }))).to.be.true;
        });

        it('should log a WEBHOOK_ERROR audit entry', async () => {
            try { await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider); } catch (_) {}

            expect(auditLogCreateStub.calledOnceWith(sinon.match({ event: 'WEBHOOK_ERROR' }))).to.be.true;
        });

        it('should re-throw the error', async () => {
            try {
                await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);
                expect.fail('Expected handlePayment to throw');
            } catch (err) {
                expect(err.message).to.include(ORDER_ID);
            }
        });
    });

    // ─── ERROR: LOOKUP FAILS ─────────────────────────────────────────────────

    describe('when mpProvider.lookupPayment fails', () => {
        beforeEach(() => {
            mockMpProvider.lookupPayment.rejects(new Error('MP API unavailable'));
        });

        it('should mark the webhookEvent as failed with the error message', async () => {
            try { await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider); } catch (_) {}

            expect(webhookEventUpdateStub.calledOnceWith(EVENT_ID, {
                status: 'failed',
                error: 'MP API unavailable'
            })).to.be.true;
        });

        it('should re-throw the error', async () => {
            try {
                await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);
                expect.fail('Expected handlePayment to throw');
            } catch (err) {
                expect(err.message).to.equal('MP API unavailable');
            }
        });
    });

    // ─── ERROR: SHIPMENT CREATION FAILS ─────────────────────────────────────

    describe('when shipmentService.create fails', () => {
        beforeEach(() => {
            shipmentCreateStub.rejects(new Error('Shipment service down'));
        });

        it('should mark the webhookEvent as failed', async () => {
            try { await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider); } catch (_) {}

            expect(webhookEventUpdateStub.calledOnceWith(EVENT_ID, {
                status: 'failed',
                error: 'Shipment service down'
            })).to.be.true;
        });

        it('should re-throw the error', async () => {
            try {
                await handlePayment(EVENT_ID, { id: PAYMENT_ID }, mockMpProvider);
                expect.fail('Expected handlePayment to throw');
            } catch (err) {
                expect(err.message).to.equal('Shipment service down');
            }
        });
    });
});
