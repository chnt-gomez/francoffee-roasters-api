const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true }, // The root 'id' of the webhook
    type: String,
    action: String,
    data: mongoose.Schema.Types.Mixed, // Store the raw data payload
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    error: String, // Store error message if it fails
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);