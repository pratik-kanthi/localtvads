const config = require.main.require('./config');

const stripe = require('stripe')(
    config.stripe.secret
);

/**
 * Charge by existing saved card
 * @param {Number} amount - amount in pounds
 * @param {String} cusToken - token of the Stripe customer starting with cus_
 * @param {String} cardToken - token of the Stripe card starting with card_
 */
const chargeByExistingCard = (amount, cusToken, cardToken) => {
    return new Promise(async (resolve, reject) => {
        try {
            const charge = await stripe.charges.create({
                amount: amount * 100 | 0,
                currency: 'gbp',
                description: '',
                customer: cusToken,
                source: cardToken,
                expand: ['balance_transaction']
            });
            resolve(charge);
        } catch (err) {
            return reject({
                code: err.statusCode,
                error: _throwError(err)
            });
        }
    });
};

/**
 * Save customer to Stripe
 * @param {String} stripeToken - token of Stripe starting with tok_
 * @param {String} email - email of the customer
 */
const saveCustomer = (stripeToken, email) => {
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
                code: err.statusCode,
                error: _throwError(err)
            });
        }
    });
};

/**
 * Save new card to the customer
 * @param {String} stripeToken - token of Stripe starting with tok_
 * @param {String} cusToken - token of the customer starting with cus_
 */
const saveNewCardToCustomer = (stripeToken, cusToken) => {
    return new Promise(async (resolve, reject) => {
        try {
            const card = await stripe.customers.createSource(cusToken, {
                source: stripeToken
            });
            resolve(card);
        } catch (err) {
            return reject({
                code: err.statusCode,
                error: _throwError(err)
            });
        }
    });
};

/**
 * Charge by a new (unsaved) card
 * @param {String} amount - amount in pounds
 * @param {String} stripeToken - token of the customer starting with tok_
 */
const chargeByCard = async (amount, stripeToken) => {
    return new Promise(async (resolve, reject) => {
        try {
            const charge = await stripe.charges.create({
                amount: amount * 100 | 0,
                currency: 'gbp',
                description: '',
                source: stripeToken,
                expand: ['balance_transaction']
            });
            resolve(charge);
        } catch (err) {
            return reject({
                code: err.statusCode,
                error: _throwError(err)
            });
        }
    });
};

/**
 * Charge by a new (unsaved) card
 * @param {String} cusToken - Stripe token for customer
 * @param {String} cardToken - Stripe token for card
 */
const deleteCardFromStripe = async (cusToken, cardToken) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await stripe.customers.deleteSource(cusToken, cardToken);
            resolve(result);
        } catch (err) {
            return reject({
                code: err.code,
                error: err.error
            });
        }
    });
};

const _throwError = (err) => {
    return utilities.ErrorMessages[err.type] ? utilities.ErrorMessages[err.type] : utilities.GeneralMessages.PAYMENT_ERROR;
};

module.exports = {
    chargeByCard,
    chargeByExistingCard,
    deleteCardFromStripe,
    saveCustomer,
    saveNewCardToCustomer
};
