const express = require('express');
const cors = require('cors');
const { dbConnection } = require('./database/mongoConfig')



class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.middleware();
        this.routes();
    }

    routes() {
        this.app.use('/items', require('#routes/item.routes'))
        this.app.use('/checkout', require('#routes/guestCheckout.routes'))
        this.app.use('/webhook', require('#routes/webhook.routes'))
    }

    listen() {
        try {
            this.app.listen(this.port, () => {
                console.log(`francoffee-api-v1 is running at port: ${this.port}`);
            });
        } catch (err) {
            console.error(`Application won't start: ${err}`)
        }
    }

    middleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    async start() {
        await dbConnection();
        this.listen();

    }
}

module.exports = Server;