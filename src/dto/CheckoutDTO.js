class CheckoutDTO {
    constructor({ payer, email, orderId, address, location, deliveryNotes }) {
        this.payer = payer;
        this.email = email;
        this.orderId = orderId;
        this.address = address;
        this.location = location; // GeoJSON format [lng, lat]
        this.deliveryNotes = deliveryNotes || '';
    }
}

module.exports = CheckoutDTO;