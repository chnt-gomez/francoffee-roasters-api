const { mongoose } = require('mongoose');

const orderSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    items: [
        {
            _id: false,
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Item',
                required: true
            },
            qty: Number,
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
        deliveryNotes: String,
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now()
    },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);