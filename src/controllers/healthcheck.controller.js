const { response } = require ('express');

const ping = (req, res = response) => {
    res.json({
        message: "pong"
    });
}
odule.exports = {
    ping
}