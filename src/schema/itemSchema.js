const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    img_src: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    available: { type: Boolean, default: true },
    onSale: { type: Boolean, default: false },
    removed: { type: Boolean, default: false, index: true }
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

const Item = mongoose.model('Item', itemSchema);

const CoffeeItem = Item.discriminator('coffee', new mongoose.Schema({
    presentation: {
        type: String,
        enum: ['250g', '500g', '1kg'],
        required: true
    }
}));

module.exports = { Item, CoffeeItem };