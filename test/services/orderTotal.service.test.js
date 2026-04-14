'use strict';

const sinon = require('sinon');
const { expect } = require('chai');

const itemService = require('#services/item.service');
const { calculateTotal } = require('#services/orderTotal.service');

describe('orderTotal.service - calculateTotal', () => {
    let itemFindStub;

    afterEach(() => sinon.restore());

    describe('happy path', () => {
        it('should return the correct total for a single item with qty > 1', async () => {
            const cartItems = [{ productId: 'item-1', qty: 2 }];
            itemFindStub = sinon.stub(itemService, 'find').resolves([
                { _id: { toString: () => 'item-1' }, price: 250 }
            ]);

            const total = await calculateTotal(cartItems);

            expect(total).to.equal(500);
        });

        it('should return the correct total for multiple items with different quantities', async () => {
            const cartItems = [
                { productId: 'item-1', qty: 2 },
                { productId: 'item-2', qty: 3 }
            ];
            itemFindStub = sinon.stub(itemService, 'find').resolves([
                { _id: { toString: () => 'item-1' }, price: 100 },
                { _id: { toString: () => 'item-2' }, price: 200 }
            ]);

            const total = await calculateTotal(cartItems);

            expect(total).to.equal(800); // (2 * 100) + (3 * 200)
        });

        it('should deduplicate product IDs before querying the database', async () => {
            const cartItems = [
                { productId: 'item-1', qty: 1 },
                { productId: 'item-1', qty: 2 }
            ];
            itemFindStub = sinon.stub(itemService, 'find').resolves([
                { _id: { toString: () => 'item-1' }, price: 100 }
            ]);

            const total = await calculateTotal(cartItems);

            expect(total).to.equal(300); // (1 * 100) + (2 * 100)
            expect(itemFindStub.calledOnceWith(sinon.match({
                _id: sinon.match({ $in: ['item-1'] })
            }))).to.be.true;
        });

        it('should query itemService.find with the deduplicated list of product IDs', async () => {
            const cartItems = [
                { productId: 'item-1', qty: 1 },
                { productId: 'item-2', qty: 1 }
            ];
            itemFindStub = sinon.stub(itemService, 'find').resolves([
                { _id: { toString: () => 'item-1' }, price: 100 },
                { _id: { toString: () => 'item-2' }, price: 50 }
            ]);

            await calculateTotal(cartItems);

            expect(itemFindStub.calledOnceWith(sinon.match({
                _id: sinon.match({ $in: sinon.match.array })
            }))).to.be.true;
        });
    });

    describe('error handling', () => {
        it('should throw when one product from the cart is not in the database', async () => {
            const cartItems = [
                { productId: 'item-1', qty: 1 },
                { productId: 'item-missing', qty: 1 }
            ];
            itemFindStub = sinon.stub(itemService, 'find').resolves([
                { _id: { toString: () => 'item-1' }, price: 100 }
            ]);

            try {
                await calculateTotal(cartItems);
                expect.fail('Expected calculateTotal to throw');
            } catch (err) {
                expect(err.message).to.equal('One or more items were not found');
            }
        });

        it('should throw when none of the requested products exist in the database', async () => {
            const cartItems = [{ productId: 'item-unknown', qty: 1 }];
            itemFindStub = sinon.stub(itemService, 'find').resolves([]);

            try {
                await calculateTotal(cartItems);
                expect.fail('Expected calculateTotal to throw');
            } catch (err) {
                expect(err.message).to.equal('One or more items were not found');
            }
        });

        it('should propagate errors thrown by itemService.find', async () => {
            const cartItems = [{ productId: 'item-1', qty: 1 }];
            itemFindStub = sinon.stub(itemService, 'find').rejects(new Error('DB connection failed'));

            try {
                await calculateTotal(cartItems);
                expect.fail('Expected calculateTotal to throw');
            } catch (err) {
                expect(err.message).to.equal('DB connection failed');
            }
        });
    });
});
