'use strict';

const { response } = require('express');
const itemService = require('#services/item.service');

const getItems = async (req, res = response) => {
    try {
        const items = await itemService.findAvailable();
        return res.status(200).json({ items });
    } catch (err) {
        return res.status(500).json({
            message: 'Could not retrieve items.',
            error: err.message
        });
    }
};

module.exports = { getItems };
