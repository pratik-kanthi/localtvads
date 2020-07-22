const fs = require('fs-extra');
const moment = require('moment');
const email = require('../email');
const config = require.main.require('./config');

const Coupon = require.main.require('./models/Coupon').model;
const ChannelProduct = require.main.require('./models/ChannelProduct').model;
const ServiceAddOn = require.main.require('./models/ServiceAddOn').model;
const ClientAd = require.main.require('./models/ClientAd').model;
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;
const Transaction = require.main.require('./models/Transaction').model;
const {
    getAllTaxes
} = require.main.require('./services/TaxService');
const {
    getPreferredCard
} = require.main.require('./services/ClientAdService');
const {
    uploadFile
} = require.main.require('./services/FileService');
const {
    chargeByExistingCard
} = require.main.require('./services/PaymentService');

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
                message: utilities.ErrorMessages.BAD_REQUEST,
            });
        }
        let query = _generateDiscountQuery(clientId, channel, adSchedule, startDate);
        if (couponCode) {
            query.$and.push({
                CouponCode: couponCode,
            });
        }
        const project = {
            ChannelPlans: 0,
            Channels: 0,
        };
        Coupon.findOne(query, project).exec((err, coupon) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            } else if (!coupon) {
                return reject({
                    code: 409,
                    error: {
                        message: utilities.ErrorMessages.COUPON_NOT_APPLICABLE,
                    },
                });
            }
            query = {
                Coupon: coupon._id,
                Client: clientId,
                Status: {
                    $in: ['SUCCEEDED', 'PENDING'],
                },
            };
            Transaction.countDocuments(query, (err, count) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                } else if (count >= coupon.PermittedUsageCount && coupon.CouponCode) {
                    return reject({
                        code: 409,
                        error: {
                            message: utilities.ErrorMessages.COUPON_ALREADY_USED,
                        },
                    });
                }
                resolve({
                    code: 200,
                    data: coupon,
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
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }
        let query = _generateDiscountQuery(clientId, channel, channelPlan, startDate);
        let coupons = [];
        try {
            coupons = await Coupon.find(query).sort({
                Amount: -1
            }).exec();
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
        const couponsUsage = {};
        const couponIds = coupons.map((coupon) => {
            couponsUsage[coupon._id.toString()] = 0;
            return coupon._id;
        });
        query = {
            Coupon: {
                $in: couponIds,
            },
            Status: 'SUCCEEDED',
        };
        const project = {
            Coupon: 1,
        };
        Transaction.find(query, project, (err, transactions) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            } else {
                for (let i = 0; i < transactions.length; i++) {
                    couponsUsage[transactions[i].Coupon.toString()]++;
                }
                const availableCoupons = coupons.slice();
                for (let i = 0; i < coupons.length; i++) {
                    if (coupons[i].PermittedUsageCount <= couponsUsage[coupons[i]._id.toString()]) {
                        availableCoupons.splice(i, 1);
                    }
                }
                resolve({
                    code: 200,
                    data: availableCoupons,
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
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        } else {
            const query = {
                _id: id,
            };
            ClientAd.findOne(query, (err, clientAd) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                } else if (!clientAd) {
                    return reject({
                        code: 400,
                        error: {
                            message: 'Ad Video' + utilities.ErrorMessages.NOT_FOUND,
                        },
                    });
                } else {
                    const clientAdObj = clientAd.toObject();
                    resolve({
                        code: 200,
                        data: clientAdObj,
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
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        } else {
            const query = {
                _id: id,
            };
            ClientAdPlan.findOne(query)
                .populate('ClientAd')
                .exec((err, clientAdPlan) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    } else if (!clientAdPlan) {
                        return reject({
                            code: 400,
                            error: {
                                message: 'Ad Video' + utilities.ErrorMessages.NOT_FOUND,
                            },
                        });
                    } else {
                        resolve({
                            code: 200,
                            data: clientAdPlan,
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
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }
        const query = {
            Client: clientId,
            PlanLength: 3,
        };
        const populateOptions = [{
            path: 'ClientAd',
            select: {
                VideoUrl: 1,
                Status: 1,
            },
        },
        {
            path: 'ChannelPlan.Plan.Channel',
            model: 'Channel',
            select: {
                Name: 1,
                Description: 1,
            },
        },
        {
            path: 'ChannelPlan.Plan.ChannelAdSchedule',
            model: 'ChannelAdSchedule',
            select: {
                _id: 1,
            },
            populate: [{
                path: 'AdSchedule',
                model: 'AdSchedule',
                select: {
                    Name: 1,
                    Description: 1,
                    StartTime: 1,
                    EndTime: 1,
                },
            }, ],
        },
        ];
        ClientAdPlan.find(query)
            .skip(parseInt(skip))
            .limit(parseInt(top))
            .populate(populateOptions)
            .sort('-BookedDate')
            .exec((err, clientAdPlans) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                resolve({
                    code: 200,
                    data: clientAdPlans,
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
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }
        const query = {
            _id: clientAdPlan,
        };
        ClientAdPlan.findOne(query, async (err, cAdPlan) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            } else if (!cAdPlan) {
                if (err) {
                    return reject({
                        code: 404,
                        error: {
                            message: 'Ad Plan' + utilities.ErrorMessages.NOT_FOUND,
                        },
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
                        error: err.error,
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
                    error: err.error,
                });
            }

            const transaction = new Transaction({
                ChannelPlan: cAdPlan.ChannelPlan,
                Client: cAdPlan.Client,
                ClientAdPlan: cAdPlan,
                TotalAmount: cAdPlan.ChannelPlan.TotalAmount,
                Status: 'SUCCEEDED',
                ReferenceId: charge.id,
                StripeResponse: charge,
                TaxBreakdown: taxes,
            });
            transaction.save((err) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }

                cAdPlan.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    resolve({
                        code: 200,
                        data: cAdPlan,
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
            if(user.Claims[0].Name !== 'Client' || user.Claims[0].Value !== cPlan.Client){
                return reject({
                    code: 403,
                    error: {
                        message: utilities.ErrorMessages.UNAUTHORISED,
                    },
                });
            }
            if (!card) {
                card = await ClientPaymentMethod.findOne({
                    _id: cardId
                }, {
                    'Card.StripeCardToken': 1,
                    StripeCusToken: 1,
                }).exec();
            }
            const clientAdPlan = new ClientAdPlan({
                Client: cPlan.Client,
                Channel: cPlan.Channel,
                Days: cPlan.Days,
                WeeklyAmount: 0,
                AddonsAmount: 0,
            });
            const channelProduct = await ChannelProduct.findOne({
                _id: cPlan.ChannelProduct
            }).deepPopulate('ProductLength ChannelSlots.Slot').lean().exec();
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
                    _id: cPlan.Addons[0]
                }).lean().exec();
                clientAdPlan.AddonsAmount = addon.Amount;
                clientAdPlan.Addons = [addon];
            }
            let taxAmount=0;
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
            try{
                transaction = await stripePayment(clientAdPlan, card, totalAmount, taxes);
            }catch(err){
                return reject({
                    code: 402,
                    error: err.error,
                });
            }
            clientAdPlan.Status='PAID';
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

function stripePayment(clientAdPlan, card, totalAmount, taxes) {
    return new Promise(async (resolve, reject) => {
        try {
            const charge = await chargeByExistingCard(totalAmount, card.StripeCusToken, card.Card.StripeCardToken);
            const transaction = new Transaction({
                ClientAdPlan: clientAdPlan._id,
                Client: clientAdPlan.Client,
                TaxBreakdown:taxes,
                TotalAmount: totalAmount,
                Status: 'SUCCEEDED',
                StripeResponse: charge,
                ReferenceId: charge.id
            });
            await transaction.save();
            resolve(transaction);
        } catch (err) {
            const transaction = new Transaction({
                Client: clientAdPlan.Client,
                TotalAmount: totalAmount,
                TaxBreakdown:taxes,
                Status: 'FAILED',
                StripeResponse: err.error,
                StripeResponseCode:err.code
            });
            await transaction.save();
            reject(err);
        }
    });

}
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
            _id: clientAdPlan,
        };
        const populateOptions = [{
            path: 'Client',
            model: 'Client',
            select: {
                Name: 1,
                Email: 1,
            },
        },
        {
            path: 'ChannelPlan.Plan.Channel',
            model: 'Channel',
            select: {
                Name: 1,
                Description: 1,
            },
        },
        {
            path: 'ChannelPlan.Plan.ChannelAdSchedule',
            model: 'ChannelAdSchedule',
            select: {
                _id: 1,
            },
            populate: [{
                path: 'AdSchedule',
                model: 'AdSchedule',
                select: {
                    Name: 1,
                    Description: 1,
                    StartTime: 1,
                    EndTime: 1,
                },
            }, ],
        },
        ];

        ClientAdPlan.findOne(query)
            .populate(populateOptions)
            .exec((err, clientAdPlan) => {
                if (err) {
                    deletePreviewFile();
                    return reject({
                        code: 500,
                        error: err,
                    });
                } else if (!clientAdPlan) {
                    deletePreviewFile();
                    return reject({
                        code: 404,
                        error: {
                            message: 'Ad ' + utilities.ErrorMessages.NOT_FOUND,
                        },
                    });
                }
                // uploadVideo
                const dst = 'uploads/Client/' + clientAdPlan.Client.id + '/ClientAdPlans/' + clientAdPlan._id.toString() + '/Ads/' + Date.now() + extension;
                try {
                    uploadFile(previewPath, dst);
                } catch (ex) {
                    deletePreviewFile();
                    return reject({
                        code: 500,
                        error: ex,
                    });
                }

                const clientAd = new ClientAd({
                    Client: clientAdPlan.Client,
                    VideoUrl: dst,
                    Status: 'UNDERREVIEW',
                });
                clientAd.save((err) => {
                    if (err) {
                        deletePreviewFile();
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    clientAdPlan.ClientAd = clientAd._id;
                    clientAdPlan.save((err) => {
                        if (err) {
                            deletePreviewFile();
                            return reject({
                                code: 500,
                                error: err,
                            });
                        }
                        deletePreviewFile();
                        socket.emit('PROCESS_FINISHED');
                        const adEmailInfo = {
                            client_name: clientAdPlan.Client.Name,
                            client_email: clientAdPlan.Client.Email,
                            booking_date: moment().format('DD/MM/YYYY'),
                            channel: clientAdPlan.ChannelPlan.Plan.Channel.Name,
                            slot: clientAdPlan.ChannelPlan.Plan.ChannelAdSchedule.AdSchedule.Name,
                            start_time: clientAdPlan.ChannelPlan.Plan.ChannelAdSchedule.AdSchedule.StartTime,
                            end_time: clientAdPlan.ChannelPlan.Plan.ChannelAdSchedule.AdSchedule.EndTime,
                            start_date: moment(clientAdPlan.StartDate).format('DD/MM/YYYY'),
                            end_date: moment(clientAdPlan.EndDate).format('DD/MM/YYYY'),
                            ad_length: clientAdPlan.ChannelPlan.Plan.Seconds,
                        };
                        const videolink = config.google_bucket.bucket_url + clientAd.VideoUrl;
                        email.helper.updateClientAdEmail(config.mailgun.adminEmail, videolink, adEmailInfo);
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
                    error: err,
                });
            }
        };
    });
};

const _generateDiscountQuery = (clientId, channel, adSchedule, startDate) => {
    const query = {
        $and: [],
    };
    if (clientId) {
        query.$and.push({
            $or: [{
                Clients: clientId,
            },
            {
                Clients: {
                    $exists: false,
                },
            },
            ],
        });
    }
    if (channel) {
        query.$and.push({
            $or: [{
                Channels: {
                    $in: [channel],
                },
            },
            {
                Channels: {
                    $exists: false,
                },
            },
            {
                Channels: [],
            },
            ],
        });
    }
    if (adSchedule) {
        query.$and.push({
            $or: [{
                AdSchedules: {
                    $in: [adSchedule],
                },
            },
            {
                AdSchedules: {
                    $exists: false,
                },
            },
            {
                AdSchedules: [],
            },
            ],
        });
    }
    if (startDate) {
        query.$and.push({
            $and: [{
                StartDate: {
                    $lte: new Date(startDate),
                },
            },
            {
                EndDate: {
                    $gte: new Date(startDate),
                },
            },
            ],
        });
    }
    return query;
};

const populateCategories = () => {
    return new Promise(async (resolve, reject) => {
        const catergories = ['AUTOMOTIVE', 'BANKING', 'CONSTRUCTION & BUILDING', 'CONSUMER GOODS', 'ELECTRONICS AND GAGDGETS', 'ENERGY', 'BOOKS & PUBLISHING', 'FOOD & BEVERAGE', 'HEALTHCARE & PHARMACEUTICALS', 'HIGH TECH INDUSTRIES', 'HOTELS, RESORTS & SPA', 'INSURANCE', 'MEDIA', 'REAL ESTATE', 'RETAIL', 'SERVICES', 'SOFTWARE PRODUCTS & SERVICES', 'TELECOM', 'TRANSPORTATION', 'TRAVEL', 'UTILITIES', 'WHOLESALE'];

        ClientAdPlan.find({}).exec((err, plans) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            }

            const promises = plans.map((plan) => {
                return new Promise(async (resolve, reject) => {
                    const val = catergories[Math.floor(Math.random() * catergories.length)];
                    plan.Category = val;
                    try {
                        const result = await plan.save().exec();
                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            Promise.all([promises])
                .then((val) => {
                    resolve({
                        code: 200,
                        data: val,
                    });
                })
                .catch((err) => {
                    return reject({
                        code: 500,
                        error: err,
                    });
                });
        });
    });
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
    populateCategories,
};