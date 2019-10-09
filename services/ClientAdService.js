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
 * @param {String} adSchedule - _id of AdSchedule
 * @param {String} startDate - startDate of the ChannelPlan
 * @param {String} couponCode - coupon code
 */
const checkCouponApplicable = (clientId, channel, adSchedule, startDate, couponCode) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId || !couponCode || !startDate) {
            return reject({
                code: 400,
                message: utilities.ErrorMessages.BAD_REQUEST
            });
        }
        let query = _generateDiscountQuery(clientId, channel, adSchedule, startDate);
        if (couponCode) {
            query.$and.push({
                CouponCode: couponCode
            });
        }
        const project = {
            ChannelPlans: 0,
            Channels: 0,
        };
        AdDiscount.findOne(query, project).exec((err, adDiscount) => {
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
        const couponsUsage = {};
        const couponIds = coupons.map(coupon => {
            couponsUsage[coupon._id.toString()] = 0;
            return coupon._id;
        });
        query = {
            AdDiscount: {
                $in: couponIds
            },
            Status: 'succeeded'
        };
        const project = {
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
                const availableCoupons = coupons.slice();
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
            const query = {
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
                    const clientAdObj = clientAd.toObject();
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
            const query = {
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
 * Get ClientAdPlan by its _id
 * @param {String} clientId - _id of Client
 * @param {String} top - top
 * @param {String} skip - skip
 */
const getClientAdPlans = (clientId, top, skip) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId || top === undefined || skip === undefined) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            Client: clientId
        };
        const project = {
            'ChannelPlan.Plan.ChannelAdSchedule.AdSchedule': 1,
            'ChannelPlan.Plan.Seconds': 1,
            'ChannelPlanPlan.Channel': 1,
            'Name': 1,
            'StartDate': 1,
            'EndDate': 1,
            'ClientAd': 1
        };
        const populateOptions = [{
            path: 'ClientAd',
            select: {
                VideoUrl: 1
            }
        }, {
            path: 'ChannelPlan.Plan.Channel',
            model: 'Channel',
            select: {
                Name: 1,
                Description: 1
            }
        }, {
            path: 'ChannelPlan.Plan.ChannelAdSchedule',
            model: 'ChannelAdSchedule',
            select: {
                _id: 1
            },
            populate: [
                {
                    path: 'AdSchedule',
                    model: 'AdSchedule',
                    select: {
                        Name: 1,
                        Description: 1,
                        StartTime: 1,
                        EndTime: 1
                    }
                }
            ]
        }];
        ClientAdPlan.find(query, project).skip(parseInt(skip)).limit(parseInt(top)).populate(populateOptions).exec((err, clientAdPlans) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: clientAdPlans
            });
        });
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
        const query = {
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
                const taxResult = await cAdPlan.ChannelPlan.SubTotal;
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

            const transaction = new Transaction({
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
 * @param {String} token - token of Stripe starting with tok_
 * @param {String} couponCode - discount coupon code
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

            const query = {
                _id: channelPlan
            };

            const project = {
                _id: 1,
                ChannelAdSchedule: 1,
                Channel: 1,
                Seconds: 1,
                BaseAmount: 1
            };

            ChannelPlan.findOne(query, project).populate('ChannelAdSchedule', 'AdSchedule').exec(async (err, chPlan) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                } else if (!chPlan) {
                    return reject({
                        code: 404,
                        error: {
                            message: 'The chosen plan' + utilities.ErrorMessages.NOT_FOUND
                        }
                    });
                } else {
                    let card;
                    if (cardId) {
                        const query = {
                            Client: clientAdPlan.Client,
                            _id: cardId
                        };
                        try {
                            card = await ClientPaymentMethod.findOne(query, {
                                'Card.StripeCardToken': 1,
                                StripeCusToken: 1
                            });
                        } catch (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }
                        if (!card) {
                            return reject({
                                code: 404,
                                error: {
                                    message: 'Card' + utilities.ErrorMessages.NOT_FOUND
                                }
                            });
                        }
                    }

                    let taxAmount, taxes, discount, finalAmount = chPlan.BaseAmount, discountAmount = 0;
                    if (couponCode) {
                        try {
                            const result = await checkCouponApplicable(clientAdPlan.Client, chPlan.Channel, chPlan.ChannelAdSchedule.AdSchedule, clientAdPlan.StartDate, couponCode);
                            discount = result.data;
                            discountAmount = discount.AmountType === 'PERCENTAGE' ? finalAmount * discount.Amount/100 : discount.Amount;
                            finalAmount = finalAmount - discountAmount;
                        } catch (ex) {
                            return reject({
                                code: ex.code || 500,
                                error: ex.error
                            });
                        }
                    }
                    try {
                        const taxResult = await getTaxes(finalAmount);
                        taxes = taxResult.taxes;
                        taxAmount = taxResult.totalTax;
                    } catch (ex) {
                        return reject({
                            code: ex.code || 500,
                            error: ex.error
                        });
                    }

                    const cAdPlan = new ClientAdPlan({
                        Name: clientAdPlan.Name,
                        Description: isNewUser ? 'First Free Ad' + clientAdPlan.Description : clientAdPlan.Description,
                        Client: clientAdPlan.Client,
                        StartDate: new Date(clientAdPlan.StartDate),
                        EndDate: clientAdPlan.EndDate,
                        IsRenewal: clientAdPlan.IsRenewal,
                        Status: 'ACTIVE',
                        DayOfWeek: moment(clientAdPlan.StartDate).isoWeekday(),
                        ChannelPlan: {
                            Plan: chPlan,
                            Extras: extras || [],
                            Discount: discountAmount,
                            Surge: 0,
                            SubTotal: chPlan.BaseAmount,
                            TaxAmount: taxAmount,
                            TotalAmount: finalAmount
                        }
                    });

                    let charge, func;
                    if (card) {
                        func = chargeByExistingCard(cAdPlan.ChannelPlan.TotalAmount, card.StripeCusToken, card.Card.StripeCardToken);
                    } else {
                        func = chargeByCard(cAdPlan.ChannelPlan.TotalAmount, token);
                    }
                    try {
                        charge = await func;
                    } catch (err) {
                        return reject({
                            code: err.code,
                            error: err.error
                        });
                    }

                    const transaction = new Transaction({
                        ChannelPlan: chPlan,
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
        const query = {
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
            const dst = 'uploads/Client' + clientAdPlan._id.toString() + '/Ads/' + Date.now() + extension;
            try {
                await uploadFile(previewPath, dst);
            } catch (ex) {
                deletePreviewFile();
                return reject({
                    code: 500,
                    error: ex
                });
            }

            const clientAd = new ClientAd({
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
        };
    });
};

const _generateDiscountQuery = (clientId, channel, adSchedule, startDate) => {
    const query = {
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
    if (adSchedule) {
        query.$and.push({
            $or: [
                {
                    AdSchedules: {
                        $in: [adSchedule]
                    }
                },
                {
                    AdSchedules: {
                        $exists: false
                    }
                },
                {
                    AdSchedules: []
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
    getClientAd,
    getClientAdPlan,
    getApplicableCoupons,
    getClientAdPlans,
    saveClientAdPlan,
    renewClientAdPlan,
    updateClientAd,
    checkCouponApplicable,
};
