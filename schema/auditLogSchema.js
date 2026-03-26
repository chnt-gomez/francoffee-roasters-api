const auditLogSchema = new mongoose.Schema({
    orderId: {type: mongoose.Schema.Types.ObjectId, ref : 'Order', index: true},
    event: {type: String, required: true},
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: {type: Date, default: Date.now}
});
const Order = mongoose.model('AuditLog', auditLogSchema);
