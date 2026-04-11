const WebhookEvent = require('#schema/webhookEventSchema');

const create = async (data) => {
    return await WebhookEvent.create(data);
};

const findById = async (id) => {
    return await WebhookEvent.findById(id);
};

const findByEventId = async (eventId) => {
    return await WebhookEvent.findOne({ eventId });
};

const find = async (filter = {}) => {
    return await WebhookEvent.find(filter);
};

const updateById = async (id, updateData) => {
    return await WebhookEvent.findByIdAndUpdate(id, updateData, { new: true });
};

// Specifically for updating your webhooks during processing
const updateByEventId = async (eventId, updateData) => {
    // using upsert: true helps prevent errors if the document wasn't fully saved yet
    return await WebhookEvent.findOneAndUpdate(
        { eventId },
        updateData,
        { new: true, upsert: true }
    );
};

const deleteById = async (id) => {
    return await WebhookEvent.findByIdAndDelete(id);
};

module.exports = {
    create,
    findById,
    findByEventId,
    find,
    updateById,
    updateByEventId,
    deleteById
};