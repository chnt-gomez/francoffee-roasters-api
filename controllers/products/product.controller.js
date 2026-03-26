const { response } = require('express');

const getAllProducts = (req, res = response) => {
    res.json({
       message: '/getAllProducts' 
    })
}

const postDetails = (req, res = response) => {
    const { saludo } = req.body;

    res.json({
        msg: 'post',
        saludo
    });
}

module.exports = {
    getAllProducts,
    postDetails
}