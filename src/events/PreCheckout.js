const orderTotalService = require('#services/orderTotal.service');
const orderService = require('#services/order.service')

const doPreCheckout = async (PreCheckoutDTO) => {
    const { items } = PreCheckoutDTO;
    const total = orderTotalService.calculateTotal(items);

    const order = await orderService.create({
        email: 'guest',
        items,
        totalAmount: total,
        paymentStatus: 'pending',
        totalAmount: total,

    });

    return {

    }




}