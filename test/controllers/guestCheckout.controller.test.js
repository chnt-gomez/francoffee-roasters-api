'use strict';

const sinon = require('sinon');
const { expect } = require('chai');

const Checkout = require('#events/Checkout');
const PreCheckout = require('#events/PreCheckout');
const { guestCheckout, preCheckout } = require('#controllers/guestCheckout.controller');

describe('guestCheckout controller', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };
    });

    afterEach(() => sinon.restore());

    // ─── guestCheckout ───────────────────────────────────────────────────────

    describe('guestCheckout', () => {
        let doCheckoutStub;

        const validBody = {
            payer: 'Test User',
            email: 'test@test.com',
            orderId: 'order-abc-123',
            address: 'Puebla Centro',
            location: [-98, 19],
            deliveryNotes: 'Leave at gate'
        };

        const checkoutResult = {
            paymentOrderId: 'mp-order-123',
            checkoutUrl: 'https://mp.com/checkout/123',
            orderId: 'order-abc-456'
        };

        beforeEach(() => {
            doCheckoutStub = sinon.stub(Checkout, 'doCheckout');
        });

        describe('happy path', () => {
            it('should return 201 with the payment order details on a successful checkout', async () => {
                doCheckoutStub.resolves(checkoutResult);

                await guestCheckout({ body: { ...validBody } }, mockRes);

                expect(mockRes.status.calledOnceWith(201)).to.be.true;
                expect(mockRes.json.calledOnceWith({
                    message: 'Payment order created',
                    ...checkoutResult
                })).to.be.true;
                expect(doCheckoutStub.calledOnce).to.be.true;
            });
        });

        describe('error handling', () => {
            it('should return 500 when doCheckout rejects', async () => {
                doCheckoutStub.rejects(new Error('Payment service unavailable'));

                await guestCheckout({ body: { ...validBody } }, mockRes);

                expect(mockRes.status.calledOnceWith(500)).to.be.true;
                expect(mockRes.json.calledOnceWith(sinon.match({
                    message: 'The checkout process could not be initialized.'
                }))).to.be.true;
            });
        });
    });

    // ─── preCheckout ─────────────────────────────────────────────────────────

    describe('preCheckout', () => {
        let doPreCheckoutStub;

        const validBody = {
            items: [
                { productId: 'item-1', qty: 2 },
                { productId: 'item-2', qty: 1 }
            ]
        };

        const preCheckoutResult = {
            order: {
                _id: 'order-xyz-789',
                email: 'guest',
                totalAmount: 500,
                paymentStatus: 'pending'
            }
        };

        beforeEach(() => {
            doPreCheckoutStub = sinon.stub(PreCheckout, 'doPreCheckout');
        });

        describe('happy path', () => {
            it('should return 201 with the created order on a successful pre-checkout', async () => {
                doPreCheckoutStub.resolves(preCheckoutResult);

                await preCheckout({ body: { ...validBody } }, mockRes);

                expect(mockRes.status.calledOnceWith(201)).to.be.true;
                expect(mockRes.json.calledOnceWith({
                    message: 'Pre-Checkout started',
                    ...preCheckoutResult
                })).to.be.true;
                expect(doPreCheckoutStub.calledOnce).to.be.true;
            });
        });

        describe('error handling', () => {
            it('should return 400 with the error message when doPreCheckout rejects', async () => {
                doPreCheckoutStub.rejects(new Error('One or more items were not found'));

                await preCheckout({ body: { ...validBody } }, mockRes);

                expect(mockRes.status.calledOnceWith(400)).to.be.true;
                expect(mockRes.json.calledOnceWith(sinon.match({
                    message: 'Pre-checkout process failed.',
                    error: 'One or more items were not found'
                }))).to.be.true;
            });
        });
    });
});
