const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const Transaction = require.main.require('./models/Transaction').model;

const subscriptionPaymentSucess = (invoice) => {
    return new Promise(async (resolve, reject) => {
        if (!invoice) {
            return reject({
                code: 500
            });
        }


        if (invoice.billing_reason == 'subscription_create') {
            ClientAdPlan.findOne({
                StripeReferenceId: invoice.subscription
            }).exec((err, cplan) => {

                if (err) {
                    return reject({
                        code: 500
                    });
                }

                if (cplan) {
                    const transaction = new Transaction({
                        ClientAdPlan: cplan._id,
                        Client: cplan.Client,
                        Amount: invoice.subtotal.toFixed(2),
                        TaxAmount: invoice.tax.toFixed(2),
                        TaxBreakdown: cplan.Taxes,
                        TotalAmount: invoice.amount_paid.toFixed(2),
                        Status: 'SUCCEEDED',
                        StripeResponse: invoice,
                        ReferenceId: invoice.subscription,
                    });

                    transaction.save((err) => {
                        if (err) {
                            return reject({
                                code: 500
                            });
                        }

                        resolve({
                            code: 200
                        });
                    });
                } else {
                    return reject({
                        code: 400
                    });
                }
            });
        }
    });
};

const subscriptionPaymentFailure = (invoice) => {
    return new Promise(async (resolve, reject) => {
        if (!invoice) {
            return reject({
                code: 500
            });
        }
    });

};


module.exports = {
    subscriptionPaymentSucess,
    subscriptionPaymentFailure
};