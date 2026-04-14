'use strict';

const sinon = require('sinon');
const { expect } = require('chai');

const orderTotalService = require('#services/orderTotal.service');
const orderService = require('#services/order.service');
const { doPreCheckout } = require('#events/PreCheckout');

describe('doPreCheckout event', () => {
    let calculateTotalStub;
    let orderCreateStub;

    const mockItems = [
        { productId: 'item-1', qty: 2 },
        { productId: 'item-2', qty: 1 }
    ];
    const mockDto = { items: mockItems };

    const mockOrder = {
        _id: 'order-xyz-789',
        email: 'guest',
        items: mockItems,
        totalAmount: 500,
        paymentStatus: 'pending'
    };

    beforeEach(() => {
        calculateTotalStub = sinon.stub(orderTotalService, 'calculateTotal').resolves(500);
        orderCreateStub = sinon.stub(orderService, 'create').resolves(mockOrder);
        sinon.stub(orderService, 'findByIdDetailed').resolves(mockOrder);
    });

    afterEach(() => sinon.restore());

    describe('happy path', () => {
        it('should return the created order wrapped in { order }', async () => {
            const result = await doPreCheckout(mockDto);

            expect(result).to.deep.equal({ detailedOrder: mockOrder });
        });

        it('should call calculateTotal with the items from the DTO', async () => {
            await doPreCheckout(mockDto);

            expect(calculateTotalStub.calledOnceWith(mockItems)).to.be.true;
        });

        it('should create the order with the calculated total, guest email, and pending status', async () => {
            await doPreCheckout(mockDto);

            expect(orderCreateStub.calledOnceWith(sinon.match({
                email: 'guest',
                items: mockItems,
                totalAmount: 500,
                paymentStatus: 'pending'
            }))).to.be.true;
        });
    });

    describe('error handling', () => {
        it('should propagate the error and not create an order when calculateTotal fails', async () => {
            calculateTotalStub.rejects(new Error('One or more items were not found'));

            try {
                await doPreCheckout(mockDto);
                expect.fail('Expected doPreCheckout to throw');
            } catch (err) {
                expect(err.message).to.equal('One or more items were not found');
            }

            expect(orderCreateStub.called).to.be.false;
        });

        it('should propagate the error when orderService.create fails', async () => {
            orderCreateStub.rejects(new Error('DB write failed'));

            try {
                await doPreCheckout(mockDto);
                expect.fail('Expected doPreCheckout to throw');
            } catch (err) {
                expect(err.message).to.equal('DB write failed');
            }
        });
    });
});
