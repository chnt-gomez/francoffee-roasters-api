'use strict';

const sinon = require('sinon');
const { expect } = require('chai');

const orderService = require('#services/order.service');
const auditLogService = require('#services/auditLog.service');
const { doCheckout } = require('#events/Checkout');

describe('doCheckout event', () => {
    let orderCreateStub;
    let orderUpdateByIdStub;
    let auditLogCreateStub;
    let mockMpProvider;

    const mockDto = {
        payer: 'Test User',
        email: 'test@test.com',
        phone: '555-0000',
        items: [{ title: 'Veracruz Coffee', quantity: 1, unit_price: 250 }],
        address: 'Puebla Centro',
        location: { type: 'Point', coordinates: [-98, 19] },
        deliveryNotes: 'Leave at gate'
    };

    const mockOrder = {
        _id: 'order-abc-123',
        email: 'test@test.com',
        paymentStatus: 'pending'
    };

    const mockPaymentOrder = {
        paymentOrderId: 'mp-pref-456',
        checkoutUrl: 'https://mp.com/checkout/456'
    };

    beforeEach(() => {
        orderCreateStub = sinon.stub(orderService, 'create').resolves(mockOrder);
        orderUpdateByIdStub = sinon.stub(orderService, 'updateById').resolves();
        auditLogCreateStub = sinon.stub(auditLogService, 'create').resolves();

        mockMpProvider = {
            createPaymentOrder: sinon.stub().resolves(mockPaymentOrder)
        };
    });

    afterEach(() => sinon.restore());

    describe('happy path', () => {
        it('should return paymentOrderId, checkoutUrl and orderId on a successful checkout', async () => {
            const result = await doCheckout(mockDto, mockMpProvider);

            expect(result).to.deep.equal({
                paymentOrderId: mockPaymentOrder.paymentOrderId,
                checkoutUrl: mockPaymentOrder.checkoutUrl,
                orderId: mockOrder._id
            });
        });

        it('should create the order with the correct payload', async () => {
            await doCheckout(mockDto, mockMpProvider);

            expect(orderCreateStub.calledOnceWith(sinon.match({
                email: mockDto.email,
                items: mockDto.items,
                paymentStatus: 'pending',
                deliveryDetails: sinon.match({
                    receipientEmail: mockDto.email,
                    receipientName: mockDto.payer,
                    address: mockDto.address
                })
            }))).to.be.true;
        });

        it('should create an ORDER_INITIALIZED audit log entry for the new order', async () => {
            await doCheckout(mockDto, mockMpProvider);

            expect(auditLogCreateStub.calledOnceWith(sinon.match({
                orderId: mockOrder._id,
                event: 'ORDER_INITIALIZED'
            }))).to.be.true;
        });

        it('should call mpProvider.createPaymentOrder with the created order', async () => {
            await doCheckout(mockDto, mockMpProvider);

            expect(mockMpProvider.createPaymentOrder.calledOnceWith(mockOrder)).to.be.true;
        });

        it('should update the order with the paymentReference returned by the provider', async () => {
            await doCheckout(mockDto, mockMpProvider);

            expect(orderUpdateByIdStub.calledOnceWith(
                mockOrder._id,
                { paymentReference: mockPaymentOrder.paymentOrderId }
            )).to.be.true;
        });
    });

    describe('error handling', () => {
        it('should propagate the error and skip remaining steps when orderService.create fails', async () => {
            orderCreateStub.rejects(new Error('DB write failed'));

            try {
                await doCheckout(mockDto, mockMpProvider);
                expect.fail('Expected doCheckout to throw');
            } catch (err) {
                expect(err.message).to.equal('DB write failed');
            }

            expect(auditLogCreateStub.called).to.be.false;
            expect(mockMpProvider.createPaymentOrder.called).to.be.false;
            expect(orderUpdateByIdStub.called).to.be.false;
        });

        it('should propagate the error and skip payment when auditLogService.create fails', async () => {
            auditLogCreateStub.rejects(new Error('Audit log unavailable'));

            try {
                await doCheckout(mockDto, mockMpProvider);
                expect.fail('Expected doCheckout to throw');
            } catch (err) {
                expect(err.message).to.equal('Audit log unavailable');
            }

            expect(mockMpProvider.createPaymentOrder.called).to.be.false;
            expect(orderUpdateByIdStub.called).to.be.false;
        });

        it('should propagate the error and skip order update when mpProvider.createPaymentOrder fails', async () => {
            mockMpProvider.createPaymentOrder.rejects(new Error('MP API error'));

            try {
                await doCheckout(mockDto, mockMpProvider);
                expect.fail('Expected doCheckout to throw');
            } catch (err) {
                expect(err.message).to.equal('MP API error');
            }

            expect(orderUpdateByIdStub.called).to.be.false;
        });

        it('should propagate the error when orderService.updateById fails', async () => {
            orderUpdateByIdStub.rejects(new Error('DB update failed'));

            try {
                await doCheckout(mockDto, mockMpProvider);
                expect.fail('Expected doCheckout to throw');
            } catch (err) {
                expect(err.message).to.equal('DB update failed');
            }
        });
    });
});
