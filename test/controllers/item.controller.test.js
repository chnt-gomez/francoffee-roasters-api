'use strict';

const sinon = require('sinon');
const { expect } = require('chai');

const itemService = require('#services/item.service');
const { getItems } = require('#controllers/item.controller');

describe('item controller', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };
    });

    afterEach(() => sinon.restore());

    describe('getItems', () => {
        let findAvailableStub;

        const mockItems = [
            { _id: 'item-1', name: 'Espresso', price: 45, available: true },
            { _id: 'item-2', name: 'Latte', price: 55, available: true }
        ];

        beforeEach(() => {
            findAvailableStub = sinon.stub(itemService, 'findAvailable');
        });

        describe('happy path', () => {
            it('should return 200 with the collection of available items', async () => {
                findAvailableStub.resolves(mockItems);

                await getItems({}, mockRes);

                expect(mockRes.status.calledOnceWith(200)).to.be.true;
                expect(mockRes.json.calledOnceWith({ items: mockItems })).to.be.true;
                expect(findAvailableStub.calledOnce).to.be.true;
            });

            it('should return 200 with an empty array when no items are available', async () => {
                findAvailableStub.resolves([]);

                await getItems({}, mockRes);

                expect(mockRes.status.calledOnceWith(200)).to.be.true;
                expect(mockRes.json.calledOnceWith({ items: [] })).to.be.true;
            });
        });

        describe('error handling', () => {
            it('should return 500 when findAvailable rejects', async () => {
                findAvailableStub.rejects(new Error('Database connection lost'));

                await getItems({}, mockRes);

                expect(mockRes.status.calledOnceWith(500)).to.be.true;
                expect(mockRes.json.calledOnceWith(sinon.match({
                    message: 'Could not retrieve items.',
                    error: 'Database connection lost'
                }))).to.be.true;
            });
        });
    });
});
