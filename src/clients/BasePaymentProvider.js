class BasePaymentProvider {
    constructor(providerName) {
        this.providerName = providerName;
    }

    async createPaymentOrder(order) {
        throw new Error(`Method 'createPaymentOrder()' must be implemented by ${this.providerName}`);
    }

}

module.exports = BasePaymentProvider;