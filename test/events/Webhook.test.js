const sinon = require('sinon');
const { expect } = require('chai');

const { handleWebhook } = require('#events/Webhook');

const Order = require('#schema/orderSchema');
const Shipment = require('#schema/shipmentSchema'); 
const AuditLog = require('#schema/auditLogSchema');

describe('Webhook Test Suite', () => {
    let sandbox;
    let mockPaymentClient;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        sandbox.stub(AuditLog, 'create').resolves();

        mockPaymentClient = {
            payments: {
                get: sandbox.stub()
            }
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('Should create shipment after payment is approved', async () => {

        const paymentId = '123456789';
        const orderId = '69c6c3b737c5ef90db7bc541';

        mockPaymentClient.payments.get.resolves({
            status: 'approved',
            external_reference: orderId
        });

        const mockOrder = new Order({
            _id: orderId,
            email: 'test@user.com',
            paymentStatus: 'pending',
            deliveryDetails: {
                address: '123 Coffee St, Puebla',
                location: { type: 'Point', coordinates: [-98, 19] },
                deliveryNotes: 'Near the cathedral'
            },
        });

        // Stub static Mongoose methods
        sandbox.stub(Order, 'findById').resolves(mockOrder);
        sandbox.stub(Order.prototype, 'save').resolves();
        const shipmentSaveStub = sandbox.stub(Shipment.prototype, 'save').resolves();
     
        // Stub save methods on prototypes
        let result = await handleWebhook(paymentId, mockPaymentClient);

        expect(result.message).to.equal('Shipment created');
        
        // Check Order Update
        expect(result.message).to.equal('Shipment created');
        expect(mockOrder.paymentStatus).to.equal('paid');
        expect(shipmentSaveStub.calledOnce).to.be.true;
        expect(mockPaymentClient.payments.get.calledOnce).to.be.true;
    });

    it('should return an error message if the payment fails (rejected)', async () => {
        const paymentId = '123456';
        const orderId = '69c6c3b737c5ef90db7bc541';

        // Mock MP: Status is rejected
        mockPaymentClient.payments.get.resolves({
            status: 'rejected',
            external_reference: orderId
        });

        const mockOrder = { _id: orderId, paymentStatus: 'pending' };
        sandbox.stub(Order, 'findById').resolves(mockOrder);
        
        // Spies/Stubs for side effects
        const shipmentSaveStub = sandbox.stub(Shipment.prototype, 'save').resolves();

        const result = await handleWebhook(paymentId, mockPaymentClient);

        expect(result.message).to.equal('Payment failed. No shipment was created');
        expect(shipmentSaveStub.called).to.be.false; // Ensure no shipment was created
    });

    it('should return an error message if the order does not exist', async () => {
        const paymentId = '123456';
        const orderId = 'NON_EXISTENT_ID';

        mockPaymentClient.payments.get.resolves({
            status: 'approved',
            external_reference: orderId
        });

        // Mock DB: Order.findById returns null
        sandbox.stub(Order, 'findById').resolves(null);

        const result = await handleWebhook(paymentId, mockPaymentClient);

        expect(result.message).to.equal('Order not found');
    });

    it('should return an error message if the order was already paid', async () => {
        const paymentId = '123456';
        const orderId = '69c6c3b737c5ef90db7bc541';

        mockPaymentClient.payments.get.resolves({
            status: 'approved',
            external_reference: orderId
        });

        // Mock DB: Order already has 'paid' status
        const mockOrder = { 
            _id: orderId, 
            paymentStatus: 'paid' 
        };
        sandbox.stub(Order, 'findById').resolves(mockOrder);
        
        const shipmentSaveStub = sandbox.stub(Shipment.prototype, 'save').resolves();

        const result = await handleWebhook(paymentId, mockPaymentClient);

        expect(result.message).to.equal('Order already processed');
        expect(shipmentSaveStub.called).to.be.false; // Crucial: no double-shipping
    });
});