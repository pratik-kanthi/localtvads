const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const Transaction = require.main.require('./models/Transaction').model;

const subscriptionPaymentSucess = (invoice) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!invoice) {
                return reject({
                    code: 500
                });
            }
            if (invoice.billing_reason == 'subscription_create') {
                try {
                    const cplan = await ClientAdPlan.findOne({
                        StripeReferenceId: invoice.subscription
                    }).exec();
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
                        await transaction.save();
                        resolve({
                            code: 200
                        });
                    }
                } catch (err) {
                    logger.logError(`Failed to save transaction for ${invoice.subscription}`, err);
                    return reject({
                        code: 400
                    });
                }
            }
        } catch (err) {
            logger.logError('Webhook failed for subscription payment success', err);
            return reject({
                code: 400
            });
        }
    });
};

const subscriptionPaymentFailure = (invoice) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!invoice) {
                return reject({
                    code: 500
                });
            }
            if (invoice.billing_reason == 'invoice.payment_failed') {
                try {
                    const cplan = await ClientAdPlan.findOne({
                        StripeReferenceId: invoice.subscription
                    }).exec();
                    if (cplan) {
                        const transaction = new Transaction({
                            ClientAdPlan: cplan._id,
                            Client: cplan.Client,
                            Amount: invoice.subtotal.toFixed(2),
                            TaxAmount: invoice.tax.toFixed(2),
                            TaxBreakdown: cplan.Taxes,
                            TotalAmount: invoice.amount_paid.toFixed(2),
                            Status: 'FAILED',
                            StripeResponse: invoice,
                            ReferenceId: invoice.subscription,
                        });
                        await transaction.save();
                        resolve({
                            code: 200
                        });
                    }
                } catch (err) {
                    logger.logError(`Failed to save transaction for ${invoice.subscription}`, err);
                    return reject({
                        code: 400
                    });
                }
            }
        } catch (err) {
            logger.logError(`Webhook failed for subscription payment failure ${invoice.subscription}`, err);
            return reject({
                code: 400
            });
        }
    });

};


module.exports = {
    subscriptionPaymentSucess,
    subscriptionPaymentFailure
};