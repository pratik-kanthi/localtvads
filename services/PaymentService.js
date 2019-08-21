var config = require.main.require('./config');

var stripe = require("stripe")(
    config.stripe.secret
);

const chargeByExistingCard = (amount, cardToken, cusToken) => {
    return new Promise(async (resolve, reject) => {
        try {
            let charge = await stripe.charges.create({
                amount: amount * 100,
                currency: "gbp",
                description: "",
                customer: cusToken,
                source: cardToken,
                expand: ["balance_transaction"]
            });
            resolve(charge);
        } catch (err) {
            return reject({
                code: 500,
                error: _throwError(err)
            });
        }
    });
};

const saveCustomer = (stripeToken, amount, email) => {
    return new Promise(async (resolve, reject) => {
        let customer;
        try {
            customer = await stripe.customers.create({
                email: email,
                source: stripeToken,
            });
            resolve(customer);
        } catch (err) {
            return reject({
                code: 500,
                error: _throwError(err)
            });
        }
    });
};

const saveNewCardToCustomer = (stripeToken, cusToken) => {
    return new Promise(async (resolve, reject) => {
        try {
            let card = await stripe.customers.createSource(cusToken, {
                source: stripeToken
            });
            resolve(card);
        } catch (err) {
            return reject({
                code: err.code,
                error: _throwError(err)
            });
        }
    });
};

const _throwError = (err) => {
    return utilities.ErrorMessages[err.type] ? utilities.ErrorMessages[err.type] : utilities.GeneralMessages.PAYMENT_ERROR
};

module.exports = {
    chargeByExistingCard,
    saveCustomer,
    saveNewCardToCustomer
};