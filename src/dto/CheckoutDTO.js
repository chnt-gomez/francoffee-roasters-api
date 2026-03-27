class CheckoutDTO {
    constructor({ payer, email, items, address, location, deliveryNotes }) {
        this.payer = payer,
        this.email = email;
        this.items = items.map(item => ({
            title: item.title,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price)
        }));
        this.address = address;
        this.location = location; // GeoJSON format [lng, lat]
        this.deliveryNotes = deliveryNotes || '';
        this.totalAmount = this.calculateTotal();

    }

    calculateTotal() {
        return this.items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    }
}

module.exports = CheckoutDTO;