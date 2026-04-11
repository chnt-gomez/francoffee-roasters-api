const AuditLog = require('#schema/auditLogSchema');

const create = async (data) => {
    return await AuditLog.create(data);
};

const findById = async (id) => {
    return await AuditLog.findById(id);
};

const find = async (filter = {}) => {
    return await AuditLog.find(filter);
};

const updateById = async (id, updateData) => {
    return await AuditLog.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteById = async (id) => {
    return await AuditLog.findByIdAndDelete(id);
};

module.exports = {
    create,
    findById,
    find,
    updateById,
    deleteById
};