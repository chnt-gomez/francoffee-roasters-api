const Order = require('#schema/orderSchema');

const create = async (data) => {
    return await Order.create(data);
};

const findById = async (id) => {
    return await Order.findById(id);
};

const find = async (filter = {}) => {
    return await Order.find(filter);
};

const updateById = async (id, updateData) => {
    return await Order.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteById = async (id) => {
    return await Order.findByIdAndDelete(id);
};

module.exports = {
    create,
    findById,
    find,
    updateById,
    deleteById
};