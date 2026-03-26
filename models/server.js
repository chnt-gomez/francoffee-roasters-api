const express = require('express');
const cors = require('cors');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT;

        this.middleware();
        this.routes();  
    }

    routes() {
        this.app.use('/products', require('../routes/product'));
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(`francoffee-api-v1 is running at port: ${this.port}`);
        });
    }

    middleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    mongo(){
        
    }
}

module.exports = Server;