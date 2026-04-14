const { Item, CoffeeItem } = require('#schema/itemSchema');

const createCoffeeItem = async (data) => {
    return await CoffeeItem.create(data);
};

const findById = async (id) => {
    return await Item.findById(id);
};

const find = async (filter = {}) => {
    return await Item.find(filter);
};

const findAvailable = async () => {
    return await Item.find({ available: true, removed: false });
};

const updateById = async (id, updateData) => {
    return await Item.findByIdAndUpdate(id, updateData, { new: true });
};

const remove = async (id) => {
    return await Item.findByIdAndUpdate(id, { removed: true }, { new: true });
};

module.exports = {
    createCoffeeItem,
    findById,
    find,
    findAvailable,
    updateById,
    remove
};
