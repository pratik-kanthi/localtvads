const config = require.main.require('./config');
const stripe = require('stripe')(config.stripe.secret);
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;
const ChannelProduct = require.main.require('./models/ChannelProduct').model;
const ServiceAddOn = require.main.require('./models/ServiceAddOn').model;
const Transaction = require.main.require('./models/Transaction').model;
const mongoose = require('mongoose');
const {
    getAllTaxes
} = require.main.require('./services/TaxService');
const {
    chargeByExistingCard
} = require.main.require('./services/PaymentService');

const getAllClientAdPlans = (page, size, sortby, status, channel) => {
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
            };

            ClientAdPlan.find(query)
                .skip(page * parseInt(size))
                .limit(parseInt(size))
                .sort(sortby)
                .populate('Client Channel')
                .exec((err, plans) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    resolve({
                        code: 200,
                        data: plans,
                    });
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

            ClientAdPlan.find({
                Client: clientid,
            })
                .populate('Channel')
                .exec((err, data) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }

                    resolve({
                        code: 200,
                        data: data,
                    });
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

            ClientAdPlan.findOne({
                _id: planId,
                Client: clientId,
            })
                .populate('Channel AdVideo AddOnAssets PaymentMethod')
                .sort({
                    BookedDate: -1,
                })
                .exec((err, data) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }

                    resolve({
                        code: 200,
                        data: data,
                    });
                });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const saveClientAdPlan = (cPlan, cardId, card, user) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!cPlan || !cPlan.Client) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            if (user.Claims[0].Name !== 'Client' || user.Claims[0].Value !== cPlan.Client) {
                return reject({
                    code: 403,
                    error: {
                        message: utilities.ErrorMessages.UNAUTHORISED,
                    },
                });
            }
            if (!card) {
                card = await ClientPaymentMethod.findOne({
                    _id: cardId,
                }, {
                    'Card.StripeCardToken': 1,
                    StripeCusToken: 1,
                }).exec();
            }
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
            clientAdPlan.Taxes = taxes;
            const totalAmount = taxAmount + clientAdPlan.WeeklyAmount + clientAdPlan.AddonsAmount;


            let transaction;
            try {
                transaction = await _stripePayment(clientAdPlan, card, totalAmount, taxAmount, taxes);
            } catch (err) {
                return reject({
                    code: 402,
                    error: err.error,
                });
            }


            clientAdPlan.Status = 'PAID';
            clientAdPlan.save(function (err) {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                delete transaction.StripeResponse;
                resolve({
                    code: 200,
                    data: transaction,
                });
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
            ClientAdPlan.findOne({
                _id: planId,
                Client: clientId,
            }).exec((err, plan) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                plan.AdVideo = mongoose.Types.ObjectId(resourceId);
                plan.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    resolve({
                        code: 200,
                        data: plan,
                    });
                });
            });
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
            ClientAdPlan.findOne({
                _id: planId,
                Client: clientId,
            }).exec((err, plan) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                /*eslint-disable */
                images.map((image) => {
                    plan.AddOnAssets.push(mongoose.Types.ObjectId(image));
                });
                /*eslint-enable */

                plan.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    resolve({
                        code: 200,
                        data: plan,
                    });
                });
            });
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

            const updated = new ClientAdPlan(plan);
            ClientAdPlan.findOneAndUpdate({
                _id: planId,
            },
            updated, {
                new: true,
            }
            ).exec((err, plan) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                resolve({
                    code: 200,
                    data: plan,
                });
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const updatePlanPayment = (client, planId, paymentMethod) => {
    return new Promise(async (resolve, reject) => {
        if (!client || !planId || !paymentMethod) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }


        ClientAdPlan.findOne({
            _id: planId
        }).exec(async (err, cplan) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            ClientPaymentMethod.findOne({
                _id: paymentMethod._id
            }).exec(async (err, method) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }

                if (method) {
                    try {
                        await stripe.subscriptions.update(
                            cplan.StripeReferenceId, {
                                default_payment_method: method.StripeCardToken
                            }
                        );
                        cplan.PaymentMethod = method._id;
                        cplan.save((err) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err
                                });
                            }

                            resolve({
                                code: 200,
                                data: method
                            });
                        });
                    } catch (err) {
                        return reject({
                            code: err.code,
                            error: err
                        });
                    }
                }
            });

        });
    });

};

const _stripePayment = (clientAdPlan, card, totalAmount, taxAmount, taxes) => {
    return new Promise(async (resolve, reject) => {
        try {
            const charge = await chargeByExistingCard(totalAmount, card.StripeCusToken, card.Card.StripeCardToken);
            const transaction = new Transaction({
                ClientAdPlan: clientAdPlan._id,
                Client: clientAdPlan.Client,
                Amount: (totalAmount - taxAmount).toFixed(2),
                TaxAmount: taxAmount.toFixed(2),
                TaxBreakdown: taxes,
                TotalAmount: totalAmount.toFixed(2),
                Status: 'SUCCEEDED',
                StripeResponse: charge,
                ReferenceId: charge.id,
            });
            await transaction.save();
            resolve(transaction);
        } catch (err) {
            const transaction = new Transaction({
                Client: clientAdPlan.Client,
                TotalAmount: totalAmount.toFixed(2),
                Amount: (totalAmount - taxAmount).toFixed(2),
                TaxAmount: taxAmount.toFixed(2),
                TaxBreakdown: taxes,
                Status: 'FAILED',
                StripeResponse: err.error,
                StripeResponseCode: err.code,
            });
            await transaction.save();
            reject(err);
        }
    });
};

module.exports = {
    getClientAdPlans,
    getClientAdPlan,
    saveClientAdPlan,
    updateClientAdPlan,
    attachVideo,
    attachImages,
    getAllClientAdPlans,
    updatePlanPayment
};