const orderSchema = new mongoose.Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null,
        index: true
    },
    email: {type: String, required: true, index: true},
    items:[
        {
            productId: String,
            title: String,
            quantity: Number,
            unit_price: Number
        }
    ],
    totalAmount: {type: Number, required: true},
    paymentStatus: {
        type: String,
        enum:['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    mpPreferenceOd: String,
    mpPaymentIdL: String,
    externalReference: {
        type: String,
        unique: true
    }
}, {timestamps: true});

const Order = mongoose.model('Order', orderSchema);