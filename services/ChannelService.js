const moment = require('moment');

const Channel = require.main.require('./models/Channel').model;
const ChannelPlan = require.main.require('./models/ChannelPlan').model;
const ChannelAdLengthCounter = require.main.require('./models/ChannelAdLengthCounter').model;

const { getApplicableOffers } = require.main.require('./services/OfferService');
const { getTaxes } = require.main.require('./services/TaxService');

/**
 * get Channels
 */
const getChannels = (projection) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            Status: {
                $in: ['LIVE', 'PROSPECTS']
            }
        };
        const project = projection || {
            'Name': 1,
            'Description': 1,
            'Status': 1,
            'Address.Location': 1,
            'Viewerships': 1
        };

        Channel.find(query, project).exec((err, channels) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: channels
            });
        });
    });
};

const getChannel = (channel_id) => {
    return new Promise(async (resolve, reject) => {
        if (!channel_id) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else {
            const query = { _id: channel_id };
            Channel.findOne(query).populate('Viewerships.AdSchedule').exec((err, channels) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }

                resolve({
                    code: 200,
                    data: channels
                });
            });
        }
    });
};

/**
 * Get availability of ad to be broadcast on a channel on a particular duration
 * @param {String} channel - _id of the channel
 * @param {Number} seconds - number of seconds of video
 * @param {String} startDateString - start Date of duration
 * @param {String} endDateString - end Date of duration
 */
const getChannelScheduleAvailability = (channel, seconds, startDateString, endDateString) => {
    return new Promise(async (resolve, reject) => {
        if (!channel || !seconds || !startDateString || !endDateString) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        seconds = parseInt(seconds);
        const splitStartDate = startDateString.split('-');
        const splitEndDate = endDateString.split('-');
        const startDate = new Date(parseInt(splitStartDate[0]), parseInt(splitStartDate[1]) - 1, parseInt(splitStartDate[2]), 0, 0, 0);
        const endDate = new Date(parseInt(splitEndDate[0]), parseInt(splitEndDate[1]) - 1, parseInt(splitEndDate[2]), 0, 0, 0);
        let query = {
            Channel: channel,
            IsActive: true
        };
        const project = {
            ChannelAdSchedule: 1
        };
        ChannelPlan.find(query, project).distinct('ChannelAdSchedule').exec((err, channelPlans) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            const channelAdScheduleIds = channelPlans.map(cp => cp);
            query = {
                $and: [
                    {
                        DateTime: {
                            $gte: startDate
                        }
                    },
                    {
                        DateTime: {
                            $lte: endDate
                        }
                    }
                ],
                ChannelAdSchedule: {
                    $in: channelAdScheduleIds
                }
            };
            const project = {
                DateTime: 1,
                TotalSeconds: 1
            };
            ChannelAdLengthCounter.find(query, project).populate('ChannelAdSchedule', 'TotalAvailableSeconds').sort({ DateTime: 1 }).exec((err, countsByDate) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                const result = {};

                for (let i = startDate; i <= endDate; i = moment(i).add(1, 'days').toDate()) {
                    result[_formatDate(i)] = [];
                }
                for (let i = 0; i < countsByDate.length; i++) {
                    const key = _formatDate(countsByDate[i].DateTime);
                    if (countsByDate[i].ChannelAdSchedule && countsByDate[i].ChannelAdSchedule.TotalAvailableSeconds < seconds + countsByDate[i].TotalSeconds) {
                        result[key].push(false);
                    }
                }
                resolve({
                    code: 200,
                    data: {
                        dates: result,
                        totalActiveSchedules: channelAdScheduleIds.length
                    }
                });
            });
        });
    });
};

/**
 * get Seconds by Channel
 * @param {String} channel - _id of the channel
 */
const getSecondsByChannel = (channel) => {
    return new Promise(async (resolve, reject) => {
        if (!channel) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            Channel: channel
        };

        const project = {
            _id: 0,
            Seconds: 1,
            ExpectedAdViews: 1
        };
        ChannelPlan.find(query, project).distinct('Seconds').exec((err, channels) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                resolve({
                    code: 200,
                    data: channels
                });
            }
        });
    });
};

/**
 * get active plans of the channel
 * @param {String} channel - _id of the channel
 * @param {Number} seconds - _id of the channel
 * @param {String} startDateString - start date
 * @param {String} endDateString - end date
 */
const getPlansByChannel = (channel, seconds, startDateString, endDateString) => {
    return new Promise(async (resolve, reject) => {
        if (!channel || !seconds || !startDateString) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        seconds = parseInt(seconds);
        const splitStartDate = startDateString.split('-');
        const startDate = new Date(parseInt(splitStartDate[0]), parseInt(splitStartDate[1]) - 1, parseInt(splitStartDate[2]), 0, 0, 0);
        const splitEndDate = endDateString.split('-');
        const endDate = new Date(parseInt(splitEndDate[0]), parseInt(splitEndDate[1]) - 1, parseInt(splitEndDate[2]), 0, 0, 0);
        // memoization - reduce space complexity and additional function calls. Store all possible key value pairs of adSchedule for later use
        const adScheduleMapping = {};
        const adScheduleViewershipMapping = {};
        try {
            const channelModel = await Channel.findOne({ _id: channel }, { Viewerships: 1 });
            if (!channelModel) {
                return reject({
                    code: 404,
                    error: 'Channel' + utilities.ErrorMessages.NOT_FOUND
                });
            }
            channelModel.Viewerships.map(views => adScheduleViewershipMapping[views.AdSchedule.toString()] = views.Count);
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
        let query = {
            Channel: channel,
            Seconds: seconds,
            IsActive: true
        };
        const project = {
            _id: 1,
            ChannelAdSchedule: 1,
            Seconds: 1,
            BaseAmount: 1
        };
        const populateOptions = {
            path: 'ChannelAdSchedule',
            select: {
                TotalAvailableSeconds: 1,
                AdSchedule: 1
            },
            populate: [
                {
                    path: 'AdSchedule',
                    model: 'AdSchedule',
                    select: {
                        _id: 1,
                        Name: 1,
                        Description: 1,
                        StartTime: 1,
                        EndTime: 1
                    }
                }
            ]
        };
        ChannelPlan.find(query, project).populate(populateOptions).sort({ 'BaseAmount': 1 }).exec((err, channelPlans) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                const channelAdScheduleIds = channelPlans.map(c => {
                    adScheduleMapping[c.ChannelAdSchedule._id.toString()] = {
                        AdSchedule: c.ChannelAdSchedule.AdSchedule,
                        ChannelAdSchedule: c.ChannelAdSchedule
                    };
                    return c.ChannelAdSchedule._id;
                });
                query = {
                    $and: [
                        {
                            DateTime: {
                                $gte: startDate
                            }
                        },
                        {
                            DateTime: {
                                $lte: endDate
                            }
                        }
                    ],
                    ChannelAdSchedule: {
                        $in: channelAdScheduleIds
                    }
                };
                const project = {
                    DateTime: 1,
                    TotalSeconds: 1,
                    ChannelAdSchedule: 1
                };
                ChannelAdLengthCounter.find(query, project).sort({ DateTime: 1 }).exec(async (err, countsByDate) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    const result = {};
                    let taxes;
                    try {
                        const taxResult = await getTaxes();
                        taxes = taxResult.taxes;
                    } catch (ex) {
                        return reject({
                            code: ex.code || 500,
                            error: ex.error
                        });
                    }

                    let offers;
                    const project = {
                        'Name': 1,
                        'Amount': 1,
                        'AmountType': 1,
                        'AdSchedules': 1,
                        'DaysOfWeek': 1,
                        'StartDate': 1,
                        'EndDate': 1
                    };
                    try {
                        const result = await getApplicableOffers(channel, undefined, startDate, project);
                        offers = result.data;
                    } catch (ex) {
                        return reject({
                            code: ex.code,
                            error: ex.error
                        });
                    }

                    for (let i = startDate; i <= endDate; i = moment(i).add(1, 'days').toDate()) {
                        const key = _formatDate(i);
                        result[key] = {};
                        channelPlans.forEach((p) => {
                            if (p.ChannelAdSchedule && adScheduleMapping[p.ChannelAdSchedule._id.toString()]) {
                                let offerDiscount = 0;
                                const appliedOffers = offers.filter(offer => {
                                    offerDiscount += calculateOffer(p.BaseAmount, offer, adScheduleMapping[p.ChannelAdSchedule._id.toString()].AdSchedule._id, key);
                                    return offerDiscount;
                                });
                                const subTotal = p.BaseAmount - offerDiscount;
                                const totalAmount = subTotal + taxes.reduce((accumulator, tax) => tax.Type === 'PERCENTAGE' ? accumulator + tax.Value * subTotal * 0.01 : accumulator + tax.Value, 0);
                                const totalAmountWithoutDiscount = p.BaseAmount + taxes.reduce((accumulator, tax) => tax.Type === 'PERCENTAGE' ? accumulator + tax.Value * p.BaseAmount * 0.01 : accumulator + tax.Value, 0);
                                result[key][adScheduleMapping[p.ChannelAdSchedule._id.toString()].AdSchedule.Name] = {
                                    Plan: p._id,
                                    Name: p.Name,
                                    Description: p.Description,
                                    AdSchedule: p.ChannelAdSchedule.AdSchedule,
                                    Seconds: p.Seconds,
                                    TotalAmount: totalAmount,
                                    TotalAmountWithoutDiscount: totalAmountWithoutDiscount,
                                    OfferDiscount: offerDiscount,
                                    Offers: appliedOffers,
                                    BaseAmount: p.BaseAmount,
                                    ViewershipCount: adScheduleViewershipMapping[p.ChannelAdSchedule.AdSchedule._id.toString()]
                                };
                            }
                        });
                    }

                    for (let i = 0; i < countsByDate.length; i++) {
                        const key = _formatDate(countsByDate[i].DateTime);
                        if (adScheduleMapping[countsByDate[i].ChannelAdSchedule.toString()] && adScheduleMapping[countsByDate[i].ChannelAdSchedule.toString()].ChannelAdSchedule) {
                            const totalAvailableSeconds = adScheduleMapping[countsByDate[i].ChannelAdSchedule.toString()].ChannelAdSchedule.TotalAvailableSeconds;
                            if (totalAvailableSeconds < seconds + countsByDate[i].TotalSeconds) {
                                result[key][adScheduleMapping[countsByDate[i].ChannelAdSchedule.toString()].AdSchedule.Name] = undefined;
                            }
                        } else {
                            return reject({
                                code: 500,
                                error: {
                                    message: utilities.ErrorMessages.INACTIVE_PLAN
                                }
                            });
                        }
                    }
                    resolve({
                        code: 200,
                        data: {
                            plans: result,
                            taxes: taxes
                        }
                    });
                });
            }
        });
    });
};

/**
 * get active plans of the nearby channel
 * @param {String} clientAdPlan - object of the ClientAdPlan model
 */
const updateChannelAdLengthCounter = (clientAdPlan) => {
    return new Promise(async (resolve, reject) => {
        const dates = [];
        for (let i = clientAdPlan.StartDate; i <= clientAdPlan.EndDate; i = moment(i).add(7, 'days').toDate()) {
            dates.push(i);
        }
        const queue = dates.map(d => _updateChannelAdLengthByDate(clientAdPlan, d));
        try {
            await Promise.all(queue);
            resolve();
        } catch (err) {
            return reject({
                code: err.code,
                error: err.error
            });
        }
    });
};

const _updateChannelAdLengthByDate = (clientAdPlan, dateTime) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            Channel: clientAdPlan.ChannelPlan.Plan.Channel,
            ChannelAdSchedule: clientAdPlan.ChannelPlan.Plan.ChannelAdSchedule,
            DateTime: dateTime
        };
        const value = {
            Channel: clientAdPlan.ChannelPlan.Plan.Channel,
            ChannelAdSchedule: clientAdPlan.ChannelPlan.Plan.ChannelAdSchedule,
            DateTime: dateTime,
            $inc: {
                TotalSeconds: clientAdPlan.ChannelPlan.Plan.Seconds
            }
        };
        ChannelAdLengthCounter.findOneAndUpdate(query, value, { upsert: true }, (err) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve();
        });
    });
};


const updateChannel = (channel_id) => {
    return new Promise(async (resolve, reject) => {
        if (!channel_id) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else {
            const query = { _id: channel_id };
            Channel.findOne(query, (err, ch) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                ch;

            });
        }
    });
};
const calculateOffer = (amount, offer, adSchedule, startDate) => {
    let discountAmount = 0;
    if ((offer.AdSchedules.length === 0 || offer.AdSchedules.indexOf(adSchedule) > -1) && (offer.DaysOfWeek.length === 0 || offer.DaysOfWeek.toObject().indexOf(moment(startDate).isoWeekday()) > -1) && new Date(startDate) <= offer.EndDate && new Date(startDate) >= offer.StartDate) {
        discountAmount = offer.AmountType === 'PERCENTAGE' ? amount * offer.Amount / 100 : offer.Amount;
    }
    return discountAmount;
};

const _formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return date.getFullYear() + '-' + (month > 9 ? month : '0' + month) + '-' + (day > 9 ? day : '0' + day);
};

const fetchChannelByPage = (page, size, sortBy) => {
    return new Promise(async (resolve, reject) => {
        page = page - 1;
        Channel.find({}).skip(page * size).limit(size).sort(sortBy).exec((err, channels) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                resolve({
                    code: 200,
                    data: channels
                });
            }
        });
    });
};

module.exports = {
    getChannels,
    getChannel,
    getSecondsByChannel,
    getPlansByChannel,
    updateChannelAdLengthCounter,
    getChannelScheduleAvailability,
    updateChannel,
    fetchChannelByPage
};
