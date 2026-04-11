const { mongoose } = require('mongoose');

const orderSchema = new mongoose.Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null,
        index: true
    },
    email: { type: String, required: true, index: true },
    items: [
        {
            productId: String,
            title: String,
            quantity: Number,
            unit_price: Number
        }
    ],
    paymentReference: {
        type: String,
        unique: true,
        sparse: true
    },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    payer: String,
    deliveryDetails: {
        receipientEmail: String,
        receipientName: String,
        address: String,
        location: {
            type: {
                type: String, enum: ['Point'], default: 'Point'
            },
            coordinates: [Number]
        },
        deliveryNotes: String

    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);