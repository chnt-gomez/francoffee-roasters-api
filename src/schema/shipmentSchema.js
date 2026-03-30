const { mongoose } = require ('mongoose');

const shipmentSchema = mongoose.Schema({
    orderId: {type: mongoose.Schema.Types.ObjectID, ref: 'Order', required: true},
    receipientEmail: String,
    address: {
        oneLineAddress: String,
        street: String,
        city: String,
        zipCode: String,
        neighborhood: String,
    },
    deliveryNotes: String,
    status: {
        type: String,
        enum: ['accepted', 'rejected', 'fulfilling', 'packaging', 'in_transit', 'delayed', 'delivered', 'cancelled'], default: 'accepted'
    },
    carrier: String,
    trackingNumber: String,
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type:[Number],
            required: false
        }
    },
    googleMapsUrl: String,
    plusCode: String
}, {timestamps: true});

shipmentSchema.index({location: '2dsphere'});

module.exports = mongoose.model('Shipment', shipmentSchema);