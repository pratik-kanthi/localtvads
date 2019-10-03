const fs = require('fs-extra');
const moment = require('moment');

const config = require.main.require('./config');

const AdDiscount = require.main.require('./models/AdDiscount').model;
const ChannelPlan = require.main.require('./models/ChannelPlan').model;
const ClientAd = require.main.require('./models/ClientAd').model;
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;
const Transaction = require.main.require('./models/Transaction').model;

const {updateChannelAdLengthCounter} = require.main.require('./services/ChannelService');
const {getPreferredCard} = require.main.require('./services/ClientAdService');
const {uploadFile} = require.main.require('./services/FileService');
const {chargeByCard, chargeByExistingCard} = require.main.require('./services/PaymentService');
const {getTaxes} = require.main.require('./services/TaxService');

/**
 * Check for Discount coupon
 * @param {String} clientId - _id of Client
 * @param {String} channel - _id of Channel
 * @param {String} channelPlan - _id of ChannelPlan
 * @param {String} startDate - startDate of the ChannelPlan
 * @param {String} couponCode - coupon code
 */
const checkCouponApplicable = (clientId, channel, channelPlan, startDate, couponCode) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId || !couponCode || !startDate) {
            return reject({
                code: 400,
                message: utilities.ErrorMessages.BAD_REQUEST
            });
        }
        let query = _generateDiscountQuery(clientId, channel, channelPlan, startDate);
        if (couponCode) {
            query.$and.push({
                CouponCode: couponCode
            });
        }
        AdDiscount.findOne(query).exec((err, adDiscount) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!adDiscount) {
                return reject({
                    code: 409,
                    error: {
                        message: utilities.ErrorMessages.COUPON_NOT_APPLICABLE
                    }
                });
            }
            query = {
                AdDiscount: adDiscount._id,
                Client: clientId,
                Status: {
                    $in: ['succeeded', 'pending']
                }
            };
            Transaction.countDocuments(query, (err, count) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                } else if (count >= adDiscount.PermittedUsageCount && adDiscount.CouponCode) {
                    return reject({
                        code: 409,
                        error: {
                            message: utilities.ErrorMessages.COUPON_ALREADY_USED
                        }
                    });
                }
                resolve({
                    code: 200,
                    data: adDiscount
                });
            });
        });
    });
};

/**
 * Get applicable discount coupons
 * @param {String} clientId - _id of Client
 * @param {String} channel - _id of Channel
 * @param {String} channelPlan - _id of ChannelPlan
 * @param {String} startDate - startDate of the ChannelPlan
 */
const getApplicableCoupons = (clientId, channel, channelPlan, startDate) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId || !channel || !channelPlan || !startDate) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let query = _generateDiscountQuery(clientId, channel, channelPlan, startDate);
        let coupons = [];
        try {
            coupons = await AdDiscount.find(query).sort({Amount: -1}).exec();
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
        let couponsUsage = {};
        let couponIds = coupons.map(coupon => {
            couponsUsage[coupon._id.toString()] = 0;
            return coupon._id
        });
        query = {
            AdDiscount: {
                $in: couponIds
            },
            Status: 'succeeded'
        };
        let project = {
            AdDiscount: 1
        };
        Transaction.find(query, project, (err, transactions) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                for (let i = 0; i < transactions.length; i++) {
                    couponsUsage[transactions[i].AdDiscount.toString()]++;
                }
                let availableCoupons = coupons.slice();
                for (let i = 0; i < coupons.length; i++) {
                    if (coupons[i].PermittedUsageCount <= couponsUsage[coupons[i]._id.toString()]) {
                        availableCoupons.splice(i, 1);
                    }
                }
                resolve({
                    code: 200,
                    data: availableCoupons
                });
            }
        });
    });
};

/**
 * Get ClientAd by its _id
 * @param {Object} id - _id of ClientAd
 */
const getClientAd = (id) => {
    return new Promise(async (resolve, reject) => {
        if (!id) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else {
            let query = {
                _id: id
            };
            ClientAd.findOne(query, (err, clientAd) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                } else if (!clientAd) {
                    return reject({
                        code: 400,
                        error: {
                            message: 'Ad Video' + utilities.ErrorMessages.NOT_FOUND
                        }
                    });
                } else {
                    let clientAdObj = clientAd.toObject();
                    resolve({
                        code: 200,
                        data: clientAdObj
                    });
                }
            });
        }
    });
};

/**
 * Get ClientAdPlan by its _id
 * @param {Object} id - _id of ClientAdPlan
 */
const getClientAdPlan = (id) => {
    return new Promise(async (resolve, reject) => {
        if (!id) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else {
            let query = {
                _id: id
            };
            ClientAdPlan.findOne(query).populate('ClientAd').exec((err, clientAdPlan) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                } else if (!clientAdPlan) {
                    return reject({
                        code: 400,
                        error: {
                            message: 'Ad Video' + utilities.ErrorMessages.NOT_FOUND
                        }
                    });
                } else {
                    resolve({
                        code: 200,
                        data: clientAdPlan
                    });
                }
            });
        }
    });
};

/**
 * Renew ClientAdPlan manually
 * @param {Object} clientAdPlan - object of ClientAdPlan
 * @param {Object} cardId - Stripe token of the card
 */
const renewClientAdPlan = (clientAdPlan, cardId) => {
    return new Promise(async (resolve, reject) => {
        if (!clientAdPlan || !cardId) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let query = {
            _id: clientAdPlan
        };
        ClientAdPlan.findOne(query, async (err, cAdPlan) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!cAdPlan) {
                if (err) {
                    return reject({
                        code: 404,
                        error: {
                            message: 'Ad Plan' + utilities.ErrorMessages.NOT_FOUND
                        }
                    });
                }
            }

            let card;
            if (cardId) {
                try {
                    card = await getPreferredCard(clientAdPlan.Client, cardId);
                } catch (err) {
                    return reject({
                        code: err.code,
                        error: err.error
                    });
                }
            }

            let charge, taxes;
            try {
                let taxResult = await (cAdPlan.ChannelPlan.SubTotal);
                taxes = taxResult.taxes;
                cAdPlan.ChannelPlan.TaxAmount = taxResult.totalTax;
                cAdPlan.ChannelPlan.TotalAmount = cAdPlan.ChannelPlan.SubTotal + cAdPlan.ChannelPlan.TaxAmount;
                charge = await chargeByExistingCard(cAdPlan.ChannelPlan.TotalAmount, card.StripeCusToken, card.Card.StripeCardToken);
            } catch (err) {
                return reject({
                    code: err.code,
                    error: err.error
                });
            }

            let transaction = new Transaction({
                ChannelPlan: cAdPlan.ChannelPlan,
                Client: cAdPlan.Client,
                ClientAdPlan: cAdPlan,
                TotalAmount: cAdPlan.ChannelPlan.TotalAmount,
                Status: 'succeeded',
                StripeResponse: charge,
                TaxBreakdown: taxes
            });
            transaction.save((err) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }

                cAdPlan.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    resolve({
                        code: 200,
                        data: cAdPlan
                    });
                });
            });
        });
    });
};

/**
 * Save ClientAdPlan based on duration and ad length
 * @param {Object} clientAdPlan - object of ClientAdPlan
 * @param {Object} channelPlan - object of ChannelPlan
 * @param {Object} extras - addons selected by the client on top of the cost of ad
 * @param {String} cardId - _id of the ClientPaymentMethod
 * @param token - token of Stripe starting with tok_
 * @param couponCode - discount coupon code
 * @param {Object} req - original object of request of API
 */
const saveClientAdPlan = (clientAdPlan, channelPlan, extras, cardId, token, couponCode, req) => {
    return new Promise(async (resolve, reject) => {
        if (!channelPlan || !clientAdPlan || !clientAdPlan.Client || !clientAdPlan.Name || !clientAdPlan.StartDate || req.user.Claims[0].Name !== 'Client' || req.user.Claims[0].Value !== clientAdPlan.Client) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        // check if the user is first timer
        let isNewUser = false;
        ClientAdPlan.countDocuments({Client: clientAdPlan.Client}, (err, count) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!count) {
                isNewUser = true;
            }

            clientAdPlan.EndDate = moment().add(config.channels.plans.duration, 'days');

            let query = {
                _id: channelPlan
            };

            let project = {
                _id: 1,
                ChannelAdSchedule: 1,
                Channel: 1,
                Seconds: 1,
                BaseAmount: 1
            };

            ChannelPlan.findOne(query, project, async (err, chAdPlan) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                } else if (!chAdPlan) {
                    return reject({
                        code: 404,
                        error: {
                            message: 'The chosen plan' + utilities.ErrorMessages.NOT_FOUND
                        }
                    });
                } else {
                    let card;
                    if (cardId) {
                        let query = {
                            Client: clientAdPlan.Client,
                            _id: cardId
                        };
                        try {
                            card = await ClientPaymentMethod.findOne(query, {
                                "Card.StripeCardToken": 1,
                                StripeCusToken: 1
                            });
                            if (!card) {
                                return reject({
                                    code: 404,
                                    error: {
                                        message: 'Card' + utilities.ErrorMessages.NOT_FOUND
                                    }
                                });
                            }
                        } catch (err) {

                        }
                    }

                    let taxAmount, taxes, discount, finalAmount = chAdPlan.BaseAmount, discountAmount = 0;
                    try {
                        let result = await checkCouponApplicable(clientAdPlan.Client, chAdPlan.Channel, chAdPlan._id, clientAdPlan.StartDate, couponCode);
                        discount = result.data;
                    } catch (ex) {
                        return reject({
                            code: ex.code || 500,
                            error: ex.error
                        });
                    }
                    if (discount) {
                        discountAmount = discount.AmountType === 'PERCENTAGE' ? (finalAmount * discount.Amount)/100 : discount.Amount;
                        finalAmount = finalAmount - discountAmount;
                    }
                    try {
                        let taxResult = await getTaxes(finalAmount);
                        taxes = taxResult.taxes;
                        taxAmount = taxResult.totalTax;
                    } catch (ex) {
                        return reject({
                            code: ex.code || 500,
                            error: ex.error
                        });
                    }

                    let cAdPlan = new ClientAdPlan({
                        Name: clientAdPlan.Name,
                        Description: isNewUser ? 'First Free Ad' + clientAdPlan.Description : clientAdPlan.Description,
                        Client: clientAdPlan.Client,
                        StartDate: new Date(clientAdPlan.StartDate),
                        EndDate: clientAdPlan.EndDate,
                        IsRenewal: clientAdPlan.IsRenewal,
                        Status: 'ACTIVE',
                        DayOfWeek: moment(clientAdPlan.StartDate).isoWeekday(),
                        ChannelPlan: {
                            Plan: chAdPlan,
                            Extras: extras || [],
                            Discount: discountAmount,
                            Surge: 0,
                            SubTotal: chAdPlan.BaseAmount,
                            TaxAmount: taxAmount,
                            TotalAmount: finalAmount
                        }
                    });

                    let charge, func;
                    if (card) {
                        func = chargeByExistingCard(cAdPlan.ChannelPlan.TotalAmount, card.StripeCusToken, card.Card.StripeCardToken);
                    } else
                        func = chargeByCard(cAdPlan.ChannelPlan.TotalAmount, token);
                    try {
                        charge = await func;
                    } catch (err) {
                        return reject({
                            code: err.code,
                            error: err.error
                        });
                    }

                    let transaction = new Transaction({
                        ChannelPlan: chAdPlan,
                        Client: clientAdPlan.Client,
                        ClientAdPlan: cAdPlan._id,
                        TotalAmount: cAdPlan.ChannelPlan.TotalAmount,
                        Status: 'succeeded',
                        StripeResponse: charge,
                        TaxBreakdown: taxes,
                        AdDiscount: discount ? discount._id : undefined
                    });
                    transaction.save((err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }
                        cAdPlan.save((err) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err
                                });
                            }
                            resolve({
                                code: 200,
                                data: cAdPlan
                            });
                            updateChannelAdLengthCounter(cAdPlan);
                        });
                    });
                }
            });
        });
    });
};

/**
 * Upload ClientAd video
 * @param {String} clientAdPlan - _id of ClientAdPlan
 * @param {String} previewPath - Path where intermediate video is stored
 * @param {String} extension - Extension of the video
 * @param {Object} socket - socket connection through which event will be sent
 */
const updateClientAd = (clientAdPlan, previewPath, extension, socket) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            _id: clientAdPlan
        };
        ClientAdPlan.findOne(query, async (err, clientAdPlan) => {
            if (err) {
                deletePreviewFile();
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!clientAdPlan) {
                deletePreviewFile();
                return reject({
                    code: 404,
                    error: {
                        message: 'Ad ' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            }
            // uploadVideo
            let dst = 'uploads/Client' + clientAdPlan._id.toString() + '/Ads/' + Date.now() + extension;
            try {
                let result = await uploadFile(previewPath, dst);
            } catch (ex) {
                deletePreviewFile();
                return reject({
                    code: 500,
                    error: ex
                });
            }

            let clientAd = new ClientAd({
                Client: clientAdPlan.Client,
                VideoUrl: dst,
                Status: 'UNDERREVIEW'
            });
            clientAd.save(err => {
                if (err) {
                    deletePreviewFile();
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                clientAdPlan.ClientAd = clientAd._id;
                clientAdPlan.save(err => {
                    if (err) {
                        deletePreviewFile();
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    deletePreviewFile();
                    socket.emit('PROCESS_FINISHED');
                    resolve(clientAd);
                });
            });
        });

        const deletePreviewFile = () => {
            try {
                fs.removeSync(previewPath);
            } catch (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
        }
    });
};

const _generateDiscountQuery = (clientId, channel, channelPlan, startDate) => {
    let query = {
        $and: []
    };
    if (clientId) {
        query.$and.push({
            $or: [
                {
                    Clients: clientId
                },
                {
                    Clients: {
                        $exists: false
                    }
                }
            ]
        });
    }
    if (channel) {
        query.$and.push({
            $or: [
                {
                    Channels: {
                        $in: [channel]
                    }
                },
                {
                    Channels: {
                        $exists: false
                    }
                },
                {
                    Channels: []
                }
            ]
        });
    }
    if (channelPlan) {
        query.$and.push({
            $or: [
                {
                    ChannelPlans: {
                        $in: [channelPlan]
                    }
                },
                {
                    ChannelPlans: {
                        $exists: false
                    }
                },
                {
                    ChannelPlans: []
                }
            ]
        });
    }
    if (startDate) {
        query.$and.push({
            $and: [{
                StartDate: {
                    $lte: new Date(startDate)
                }
            }, {
                EndDate: {
                    $gte: new Date(startDate)
                }
            }]
        });
    }
    return query;
};

module.exports = {
    saveClientAdPlan,
    renewClientAdPlan,
    getClientAd,
    getClientAdPlan,
    updateClientAd,
    checkCouponApplicable,
    getApplicableCoupons
};
