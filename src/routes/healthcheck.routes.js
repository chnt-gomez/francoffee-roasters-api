const { Router } = require ('express');
const { ping } = require('../controllers/healthcheck.controller');

const router = Router();

router.get('/ping', ping)