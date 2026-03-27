const sinon = require('sinon');
const { expect } = require('chai');

const Order = require('#schema/orderSchema');
const Shipment = require('#schema/shipmentSchema');
const AuditLog = require('#schema/auditLogSchema');

const {doCheckout} = require('#events/Checkout');


describe('Checkout event Test Suite', () => {

    let mpCreateStub;
    let orderSaveStub;
    let shipmentSaveStub;
    let auditLogStub;

    const mockDto = {
        email: 'test@test.com',
        items: [{ title: 'Veracruz Coffee', quantity: 1, unit_price: 250 }],
        totalAmount: 250,
        address: 'Puebla Centro',
        location: { type: 'Point', coordinates: [-98, 19] },
        deliveryNotes: 'Leave at gate'
    };

    const mockPaymentClient = {
        preferences : {
            create: () => {}
        }
    };

    beforeEach(() => {
        orderSaveStub = sinon.stub(Order.prototype, 'save').resolves();
        shipmentSaveStub = sinon.stub(Shipment.prototype, 'save').resolves();
        auditLogStub = sinon.stub(AuditLog, 'create').resolves();
        mpCreateStub = sinon.stub(mockPaymentClient.preferences, 'create').resolves({
            id: 'pref_123',
            init_point: 'http://mercadopago.com/test'
        });
    });

    afterEach(() => {
        
    });

    it('should orchestrate the full checkout flow correctly', async () => {
        const result = await doCheckout(mockDto, mockPaymentClient);

        // Assertions (Chai)
        expect(result.preferenceId).to.equal('pref_123');
        expect(result.initPoint).to.equal('http://mercadopago.com/test');

        // Verify Interactions (Sinon / Mockito style)
        expect(orderSaveStub.calledTwice).to.be.true; // Once initial, once with MP ID
        expect(shipmentSaveStub.calledOnce).to.be.true;
        expect(auditLogStub.calledOnceWith(sinon.match({ event: 'ORDER_INITIALIZED' }))).to.be.true;
        expect(mpCreateStub.calledOnce).to.be.true;
    });
});