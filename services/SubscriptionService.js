const config = require.main.require('./config');
const stripe = require('stripe')(
    config.stripe.secret
);


const createSubscriptionCustomer = (customer_name, customer_email, default_payment_method) => {
    return new Promise(async (resolve, reject) => {

        if (!customer_name || !customer_email) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        try {
            const customer = await stripe.customers.create({
                email: customer_email,
                name: customer_name,
                payment_method: default_payment_method
            });

            resolve({
                code: 200,
                data: customer
            });

        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }

    });
};


module.exports = {
    createSubscriptionCustomer
};