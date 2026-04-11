'use strict';

const sinon = require('sinon');
const { expect } = require('chai');

const Checkout = require('#events/Checkout');
const { guestCheckout } = require('#controllers/guestCheckout.controller');

describe('guestCheckout controller', () => {
    let doCheckoutStub;
    let mockReq;
    let mockRes;

    const validBody = {
        payer: 'Test User',
        email: 'test@test.com',
        items: [{ title: 'Veracruz Coffee', quantity: 1, unit_price: 250 }],
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
        mockRes = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };
        mockReq = { body: { ...validBody } };
    });

    afterEach(() => sinon.restore());

    describe('happy path', () => {
        it('should return 201 with the payment order details on a successful checkout', async () => {
            doCheckoutStub.resolves(checkoutResult);

            await guestCheckout(mockReq, mockRes);

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

            await guestCheckout(mockReq, mockRes);

            expect(mockRes.status.calledOnceWith(500)).to.be.true;
            expect(mockRes.json.calledOnceWith({
                message: 'The checkout process could not be initialized.'
            })).to.be.true;
        });

        it('should return 500 and not call doCheckout when CheckoutDTO construction fails', async () => {
            mockReq.body = { payer: 'Test User', email: 'test@test.com' }; // items missing → constructor throws

            await guestCheckout(mockReq, mockRes);

            expect(mockRes.status.calledOnceWith(500)).to.be.true;
            expect(mockRes.json.calledOnceWith({
                message: 'The checkout process could not be initialized.'
            })).to.be.true;
            expect(doCheckoutStub.called).to.be.false;
        });
    });
});
