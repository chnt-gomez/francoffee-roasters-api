'use strict';

const sinon = require('sinon');
const { expect } = require('chai');
const express = require('express');
const request = require('supertest');

const createRouter = require('#routes/webhook.routes');

describe('POST /webhook/mercadopago route', () => {
    let mockValidateSignature;
    let mockHandleWebhook;
    let app;

    beforeEach(() => {
        mockHandleWebhook = sinon.stub().callsFake((req, res) => res.status(200).send('OK'));

        app = express();
        app.use(express.json());
    });

    afterEach(() => sinon.restore());

    describe('when the signature middleware accepts the request', () => {
        beforeEach(() => {
            mockValidateSignature = sinon.stub().callsFake((req, res, next) => next());
            app.use('/', createRouter(mockValidateSignature, mockHandleWebhook));
        });

        it('should forward the request to the controller and return 200', async () => {
            await request(app)
                .post('/mercadopago')
                .send({ id: 'evt-001', type: 'payment', action: 'payment.created', data: { id: 'pay-123' } })
                .expect(200);

            expect(mockValidateSignature.calledOnce).to.be.true;
            expect(mockHandleWebhook.calledOnce).to.be.true;
        });

        it('should call the middleware before the controller', async () => {
            await request(app).post('/mercadopago').send({});

            expect(mockValidateSignature.calledBefore(mockHandleWebhook)).to.be.true;
        });
    });

    describe('when the signature middleware rejects the request', () => {
        beforeEach(() => {
            mockValidateSignature = sinon.stub().callsFake((req, res) => {
                res.status(401).json({ message: 'Invalid signature' });
            });
            app.use('/', createRouter(mockValidateSignature, mockHandleWebhook));
        });

        it('should return 401 and not call the controller', async () => {
            await request(app)
                .post('/mercadopago')
                .send({ id: 'evt-001' })
                .expect(401);

            expect(mockValidateSignature.calledOnce).to.be.true;
            expect(mockHandleWebhook.called).to.be.false;
        });
    });

    describe('unmatched routes', () => {
        beforeEach(() => {
            mockValidateSignature = sinon.stub().callsFake((req, res, next) => next());
            app.use('/', createRouter(mockValidateSignature, mockHandleWebhook));
        });

        it('should return 404 for GET /mercadopago', async () => {
            await request(app).get('/mercadopago').expect(404);

            expect(mockHandleWebhook.called).to.be.false;
        });

        it('should return 404 for POST to an unknown path', async () => {
            await request(app).post('/unknown').expect(404);

            expect(mockHandleWebhook.called).to.be.false;
        });
    });
});
