const Shipment = require('#schema/shipmentSchema');

const create = async (data) => {
    return await Shipment.create(data);
};

const findById = async (id) => {
    return await Shipment.findById(id);
};

const find = async (filter = {}) => {
    return await Shipment.find(filter);
};

const updateById = async (id, updateData) => {
    return await Shipment.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteById = async (id) => {
    return await Shipment.findByIdAndDelete(id);
};

module.exports = {
    create,
    findById,
    find,
    updateById,
    deleteById
};