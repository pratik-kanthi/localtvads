const config = require.main.require('./config');
const stripe = require('stripe')(config.stripe.secret);


const createStripeCustomer = (name, email, stripecardtoken) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!name || !email || !stripecardtoken) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const result = await stripe.customers.create({
                payment_method: stripecardtoken,
                name: name,
                email: email,
            });
            logger.logInfo(`Created stripe customer for ${email}`);
            resolve(result);

        } catch (err) {
            logger.logError(`Failed to create Stripe customer for ${email}`, err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};


const updateCustomer = (customertoken, updateOptions) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!customertoken) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const result = await stripe.customers.update(customertoken, updateOptions);
            resolve(result);
        } catch (err) {
            logger.logError('Failed to update stripe customer', err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};


const createProduct = (name, isActive) => {
    return new Promise(async (resolve, reject) => {
        try {

            if (!name) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const result = await stripe.products.create({
                name: name || 'LOCAL_TV_ADS_PLAN',
                active: isActive,
            });

            logger.logInfo(`Created stripe product ${name}`);
            resolve(result);

        } catch (err) {
            logger.logError(`Failed to create stripe product ${name}`, err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};



const createSubscription = (customer, payment_method, items, tax_rates, options) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!customer || !payment_method || !items) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const result = await stripe.subscriptions.create({
                customer: customer,
                default_payment_method: payment_method,
                items: items,
                default_tax_rates: tax_rates,
                expand: ['latest_invoice.payment_intent'],
                ...options,

            });
            resolve(result);
        } catch (err) {
            logger.logError('Failed to create stripe subscription', err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};


const retrieveSubscription = (subscription_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!subscription_id) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const result = await stripe.subscriptions.retrieve(subscription_id);
            resolve(result);
        } catch (err) {
            logger.logError('Failed to update stripe subscription', err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const updateSubscription = (subscription_id, updateOptions) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!subscription_id) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const result = await stripe.subscriptions.update(subscription_id, updateOptions);
            resolve(result);
        } catch (err) {
            logger.logError('Failed to update stripe subscription', err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};


const createCharge = (amount, currency, source, customer, name) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!amount || !currency || !source) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            amount = parseFloat(amount).toFixed(2) * 100;
            const result = await stripe.paymentIntents.create({
                amount: amount,
                currency: currency,
                payment_method: source,
                capture_method: 'automatic',
                confirm: true,
                customer: customer,
                description: `Announcement for ${name}`
            });
            resolve(result);
        } catch (err) {
            logger.logError('Failed to create stripe charge', err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const createPrice = (amount, currency, product, options) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!amount || !product || !currency) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            amount = parseFloat(amount).toFixed(2) * 100;
            const result = await stripe.prices.create({
                unit_amount: amount,
                currency: currency,
                product: product,
                ...options
            });
            resolve(result);
        } catch (err) {
            logger.logError('Failed to create stripe price', err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};


const attachPaymentMethod = (stripecustomerid, stripecardtoken) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!stripecustomerid || !stripecardtoken) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }

            const result = await stripe.paymentMethods.attach(
                stripecardtoken, {
                    customer: stripecustomerid
                }
            );
            logger.logInfo(`Attached payment method ${stripecardtoken} to stripe customer ${stripecardtoken}`);
            resolve(result);

        } catch (err) {
            logger.logError('Failed to attach payment method', err);

            return reject({
                code: 500,
                error: err
            });
        }
    });
};


const detachPaymentMethod = (stripecardtoken) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!stripecardtoken) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const result = await stripe.paymentMethods.detach(stripecardtoken);
            logger.logInfo(`Detached payment method ${stripecardtoken}`);
            resolve(result);
        } catch (err) {
            logger.logError('Failed to detach payment method', err);
            resolve();
        }
    });
};


const confirmPaymentIntent = (payment_intent) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!payment_intent) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const result = await stripe.paymentIntents.confirm(payment_intent);
            resolve(result);
        } catch (err) {
            logger.logError('Failed to detach payment method', err);
            resolve();
        }
    });
};


module.exports = {
    createStripeCustomer,
    attachPaymentMethod,
    detachPaymentMethod,
    createProduct,
    createPrice,
    createSubscription,
    retrieveSubscription,
    updateSubscription,
    createCharge,
    updateCustomer,
    confirmPaymentIntent
};