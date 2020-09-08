const config = require.main.require('./config');
const stripe = require('stripe')(config.stripe.secret);
const mongoose = require('mongoose');

const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const Client = require.main.require('./models/Client').model;
const Transaction = require.main.require('./models/Transaction').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;
const ChannelProduct = require.main.require('./models/ChannelProduct').model;
const ServiceAddOn = require.main.require('./models/ServiceAddOn').model;


const {
    saveCard
} = require.main.require('./services/ClientService');

const {
    createCharge,
    createPrice,
    createStripeCustomer,
    attachPaymentMethod,
    createProduct,
    createSubscription
} = require.main.require('./services/StripeService');

const {
    getAllTaxes
} = require.main.require('./services/TaxService');


const saveClientAdPlan = (plan, newCard, savedCard) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!plan.Client || !plan.Channel) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }

            let isNewCustomer, customer, stripe_response, paymentSource = null;

            const client = await Client.findOne({
                _id: plan.Client
            }).exec();


            if (!client) {
                logger.logError(`Failed to save client ad plan. Client ${plan.Client} not found`);
                return reject({
                    code: 500,
                    error: {
                        message: utilities.ErrorMessages.CLIENT_NOT_FOUND
                    }
                });
            }

            paymentSource = await _getPaymentSource(plan.Client, newCard, savedCard);

            if (!client.StripeCustomerId) {
                customer = (await createStripeCustomer(client.Name, client.Email, paymentSource.StripeCardToken)).id;
                isNewCustomer = true;
            } else {
                customer = client.StripeCustomerId;
            }

            const clientAdPlan = await _generateClientAdPlan(plan);

            if (clientAdPlan.IsSubscription) {
                //generate subscriptions
                const product = await createProduct(plan.Name, true);
                const subscriptionPrice = await createPrice(clientAdPlan.WeeklyAmount, 'gbp', product.id, {
                    recurring: {
                        interval: 'week',
                    }
                });


                let addonsPrice;
                if (plan.Addons.length > 0) {
                    addonsPrice = await createPrice(clientAdPlan.AddonsAmount, 'gbp', product.id);
                }

                const taxes = (await getAllTaxes()).data;
                const stripeTaxIds = taxes.map(tax => {
                    return tax.StripeTaxId;
                });

                const subscription_items = [{
                    price: subscriptionPrice.id,
                }];


                const subscription_options = {};
                if (addonsPrice) {
                    subscription_options.add_invoice_items = [{
                        price: addonsPrice.id
                    }];
                }

                stripe_response = await createSubscription(customer, paymentSource.StripeCardToken, subscription_items, stripeTaxIds, subscription_options);
                clientAdPlan.StripeReferenceId = stripe_response.id;

            } else {
                //generate one time charge
                stripe_response = await createCharge(clientAdPlan.totalAmount, 'gbp', paymentSource.StripeCardToken, customer, clientAdPlan.Name);
                clientAdPlan.StripeReferenceId = stripe_response.id;
            }


            clientAdPlan.Status = 'PAID';
            clientAdPlan.PaymentMethod = paymentSource._id;

            try {
                await clientAdPlan.save();
            } catch (err) {
                logger.logError(`Failed to save client ad plan for user ${plan.Client} on channel ${plan.Channel}`, err);
                return reject({
                    code: 500,
                    error: err,
                });
            }


            if (isNewCustomer) {
                try {
                    client.StripeCustomerId = customer;
                    await client.save();
                } catch (err) {
                    logger.logError(`Failed to save client ad plan for user ${plan.Client} on channel ${plan.Channel}`, err);
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
            }


            if (newCard) {
                await attachPaymentMethod(customer, paymentSource.StripeCardToken);
            }

            try {
                const transaction = new Transaction({
                    ClientAdPlan: clientAdPlan._id,
                    Client: clientAdPlan.Client,
                    Amount: (clientAdPlan.totalAmount - clientAdPlan.taxAmount).toFixed(2),
                    TaxAmount: clientAdPlan.taxAmount.toFixed(2),
                    TaxBreakdown: clientAdPlan.Taxes,
                    TotalAmount: clientAdPlan.totalAmount.toFixed(2),
                    Status: 'SUCCEEDED',
                    StripeResponse: stripe_response,
                    ReferenceId: stripe_response.id,
                });

                await transaction.save();
                resolve({
                    code: 200,
                    data: transaction
                });

            } catch (err) {
                logger.logError(`Failed to save client ad plan for user ${plan.Client} on channel ${plan.Channel}`, err);
                return reject({
                    code: 500,
                    error: err,
                });
            }


        } catch (err) {
            logger.logError(`Failed to create client plan for user ${plan.Client} on channel ${plan.Channel}`, err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const getAllClientAdPlans = (page, size, sortby, status, channel, client) => {
    return new Promise(async (resolve, reject) => {
        try {
            page = parseInt(page) - 1;
            const query = {
                ...status && {
                    Status: status,
                },
                ...channel && {
                    Channel: channel,
                },
                ...client && {
                    Client: client,
                },
            };
            const plans = await ClientAdPlan.find(query)
                .skip(page * parseInt(size))
                .limit(parseInt(size))
                .sort(sortby)
                .populate('Client Channel')
                .lean()
                .exec();

            resolve({
                code: 200,
                data: plans
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const getClientAdPlans = (clientid) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!clientid) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                Client: clientid
            };
            const result = await ClientAdPlan.find(query)
                .populate('Channel')
                .sort('BookedDate')
                .lean()
                .exec();

            resolve({
                code: 200,
                data: result
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const getClientAdPlan = (clientId, planId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!planId || !clientId) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                _id: planId,
                Client: clientId,
            };
            const result = await ClientAdPlan.findOne(query)
                .populate('Channel AdVideo AddOnAssets PaymentMethod')
                .lean()
                .exec();

            resolve({
                code: 200,
                data: result
            });

        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const attachVideo = (clientId, planId, resourceId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!clientId || !planId || !resourceId) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                _id: planId,
                Client: clientId,
            };
            const plan = await ClientAdPlan.findOne(query).exec();
            try {
                plan.AdVideo = mongoose.Types.ObjectId(resourceId);
                const result = await plan.save();
                resolve({
                    code: 200,
                    data: result
                });

            } catch (err) {
                logger.logError(`Failed to attach resource ${resourceId} to ${planId} for user ${clientId}`, err);
                return reject({
                    code: 500,
                    error: err,
                });
            }
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const attachImages = (clientId, planId, images) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!clientId || !planId || images.length == 0) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }

            const query = {
                _id: planId,
                Client: clientId,
            };

            const plan = await ClientAdPlan.findOne(query).exec();
            /*eslint-disable */
            images.map((image) => {
                plan.AddOnAssets.push(mongoose.Types.ObjectId(image));
            });
            /*eslint-enable */

            try {
                const result = await plan.save();
                resolve({
                    code: 200,
                    data: result,
                });
            } catch (err) {
                logger.logError(`Failed to attach assets to client ad plan ${planId}`, err);
                return reject({
                    code: 500,
                    error: err,
                });
            }
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const updateClientAdPlan = (planId, plan) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!planId || !plan) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                _id: planId
            };
            const updated = new ClientAdPlan(plan);
            const result = await ClientAdPlan.findOneAndUpdate(query, updated, {
                new: true
            });
            resolve({
                code: 200,
                data: result
            });
        } catch (err) {
            logger.logError(`Failed to update client ad plan ${planId}`, err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const updatePlanPayment = (client, planId, paymentMethod) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!client || !planId || !paymentMethod || !paymentMethod._id) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }

            const query = {};

            query._id = planId;
            const cplan = await ClientAdPlan.findOne(query).exec();

            query._id = paymentMethod._id;
            const method = await ClientPaymentMethod.findOne(query).lean().exec();

            try {
                await stripe.subscriptions.update(
                    cplan.StripeReferenceId, {
                        default_payment_method: method.StripeCardToken
                    }
                );
                cplan.PaymentMethod = method._id;
                await cplan.save();
                resolve({
                    code: 200,
                    data: method
                });
            } catch (err) {
                logger.logError(`Failed to update payment method ${paymentMethod._id} on plan ${planId} for client ${client}`, err);
                return reject({
                    code: 500,
                    error: err
                });
            }
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });

};

const _getPaymentSource = (client, newcard, savedcard) => {
    return new Promise(async (resolve, reject) => {
        try {
            let paymentSource;
            if (newcard) {
                paymentSource = await saveCard(client, newcard);
            } else if (savedcard) {
                paymentSource = await ClientPaymentMethod.findOne({
                    _id: savedcard,
                });
            }
            resolve(paymentSource);
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const _generateClientAdPlan = (cPlan) => {
    return new Promise(async (resolve, reject) => {
        try {

            const clientAdPlan = new ClientAdPlan({
                Name: cPlan.Name,
                VAT: cPlan.VAT,
                Client: cPlan.Client,
                Channel: cPlan.Channel,
                Days: cPlan.Days,
                WeeklyAmount: 0,
                AddonsAmount: 0,
                BillingAddress: cPlan.BillingAddress,
            });

            const channelProduct = await ChannelProduct.findOne({
                _id: cPlan.ChannelProduct,
            })
                .deepPopulate('ProductLength ChannelSlots.Slot')
                .lean()
                .exec();

            const channelSlots = channelProduct.ChannelSlots.filter((item) => {
                return cPlan.ChannelSlots.indexOf(item.Slot._id.toString()) != -1;
            });

            clientAdPlan.ChannelProduct = {
                ProductLength: channelProduct.ProductLength,
                ChannelSlots: channelSlots,
            };

            for (let i = 0, len = channelSlots.length; i < len; i++) {
                clientAdPlan.WeeklyAmount += channelSlots[i].RatePerSecond * channelSlots[i].Duration * clientAdPlan.Days.length;
            }

            if (cPlan.Addons && cPlan.Addons.length > 0) {
                const addon = await ServiceAddOn.findOne({
                    _id: cPlan.Addons[0],
                })
                    .lean()
                    .exec();
                clientAdPlan.AddonsAmount = addon.Amount;
                clientAdPlan.Addons = [addon];
            }

            let taxAmount = 0;
            const taxes = (await getAllTaxes()).data;

            for (let i = 0, len = taxes.length; i < len; i++) {
                if (taxes[i].Type === 'FIXED') {
                    taxAmount += taxes[i].Value;
                } else {
                    taxAmount += taxes[i].Value * 0.01 * (clientAdPlan.WeeklyAmount + clientAdPlan.AddonsAmount);
                }
            }

            if (channelProduct.ProductLength.Duration == 0) {
                clientAdPlan.IsSubscription = false;
            } else {
                clientAdPlan.IsSubscription = true;
            }

            clientAdPlan.Taxes = taxes;
            clientAdPlan.taxAmount = taxAmount;
            clientAdPlan.totalAmount = taxAmount + clientAdPlan.WeeklyAmount + clientAdPlan.AddonsAmount;

            resolve(clientAdPlan);

        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};


const approveAd = (planId, startDate) => {
    return new Promise(async (resolve, reject) => {
        try {

            const plan = await ClientAdPlan.findOne({
                _id: planId
            }).exec();

            if (plan && plan.AdVideo) {
                plan.Status = 'LIVE';
                plan.StartDate = startDate;
                try {
                    const result = await plan.save();
                    resolve({
                        code: 200,
                        data: result
                    });
                } catch (err) {
                    logger.logError(`Failed to save status for plan ${planId}`, err);
                    return reject({
                        code: 500,
                        error: err
                    });
                }

            } else {
                logger.logError(`Final Ad Video not present to approve ad ${planId}`);
                return reject({
                    code: 500,
                    error: {
                        message: 'Ad Video is not attached. Please verify if the final video is attached under "Assets"'
                    }
                });
            }

        } catch (err) {
            logger.logError(`Failed to approve ad ${planId}`, err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const rejectAd = (planId) => {
    return new Promise(async (resolve, reject) => {
        try {

            const plan = await ClientAdPlan.findOne({
                _id: planId
            }).exec();

            if (plan && plan.AdVideo) {
                plan.Status = 'REJECTED';
                try {
                    const result = await plan.save();
                    resolve({
                        code: 200,
                        data: result
                    });
                } catch (err) {
                    logger.logError(`Failed to save status for plan ${planId}`, err);
                    return reject({
                        code: 500,
                        error: err
                    });
                }

            } else {
                logger.logError(`Final Ad Video not present to reject ad ${planId}`);
                return reject({
                    code: 500,
                    error: {
                        message: 'Ad Video is not attached. Please verify if the final video is attached under "Assets"'
                    }
                });
            }

        } catch (err) {
            logger.logError(`Failed to approve ad ${planId}`, err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

module.exports = {
    getClientAdPlans,
    getClientAdPlan,
    updateClientAdPlan,
    attachVideo,
    attachImages,
    getAllClientAdPlans,
    updatePlanPayment,
    saveClientAdPlan,
    approveAd,
    rejectAd
};