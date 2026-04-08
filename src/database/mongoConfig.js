const mongoose  = require ('mongoose');

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Mongo DB Client Online');
    } catch ( error )  {
        console.error(`Database initialization error: ${error}`);
        throw new Error("Database connection error");
    }
}

module.exports = {
    dbConnection
}