const orderTotalService = require('#services/orderTotal.service');
const orderService = require('#services/order.service')

const doPreCheckout = async (PreCheckoutDTO) => {
    const { items } = PreCheckoutDTO;

    const total = await orderTotalService.calculateTotal(items);

    const order = await orderService.create({
        email: 'guest',
        items,
        totalAmount: total,
        paymentStatus: 'pending',
        totalAmount: total,
        statusUpdatedAt: Date.now()
    });

    const detailedOrder = await orderService.findByIdDetailed(order._id);

    return {
        detailedOrder
    }
}

module.exports = {
    doPreCheckout
}