const itemService = require('#services/item.service');

const calculateTotal = async (cartItems) => {

    // 1. Extract unique product IDs using a Set to prevent false errors
    const itemIds = [...new Set(cartItems.map(item => item.productId))];

    // 2. Fetch items from the database in one go
    const dbItems = await itemService.find({ _id: { $in: itemIds } });

    // 3. Verify all unique products exist
    if (dbItems.length !== itemIds.length) {
        throw new Error('One or more items were not found');
    }

    // 4. Create a quick lookup dictionary for prices (O(1) access time)
    const priceLookup = dbItems.reduce((acc, item) => {
        acc[item._id.toString()] = item.price;
        return acc;
    }, {});

    // 5. Calculate the total by looping through the original cart
    let total = 0;

    for (const item of cartItems) {
        const price = priceLookup[item.productId];
        total += price * item.qty;
    }

    return _round(total);
}

const _round = (value) => Math.round(value * 100) / 100;

module.exports = { calculateTotal }