'use strict';

const { Router } = require('express');
const { getItems } = require('#controllers/item.controller');

const router = Router();

router.get('/', getItems);

module.exports = router;
