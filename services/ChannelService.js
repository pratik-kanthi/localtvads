const moment = require('moment');

const Channel = require.main.require('./models/Channel').model;
const ChannelPlan = require.main.require('./models/ChannelPlan').model;
const ChannelAdLengthCounter = require.main.require('./models/ChannelAdLengthCounter').model;

/**
 * get Channels
 */
const getChannels = () => {
    return new Promise(async (resolve, reject) => {
        let query = {
            Status: "LIVE"
        };
        let project = {
            "Name": 1,
            "Description": 1,
            "Address.Location": 1
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
        let query = {
            Channel: channel
        };

        let project = {
            _id: 0,
            Seconds: 1,
            ExpectedAdViews: 1
        };
        ChannelPlan.find(query, project).distinct('Seconds').exec((err, channels) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                })
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
        let splitStartDate = startDateString.split('-');
        let startDate = new Date(parseInt(splitStartDate[0]), parseInt(splitStartDate[1]) - 1, parseInt(splitStartDate[2]), 0, 0, 0);
        let splitEndDate = endDateString.split('-');
        let endDate = new Date(parseInt(splitEndDate[0]), parseInt(splitEndDate[1]) - 1, parseInt(splitEndDate[2]), 0, 0, 0);
        // memoization - reduce space complexity and additional function calls. Store all possible key value pairs of adSchedule for later use
        let adScheduleMapping = {};

        let query = {
            Channel: channel,
            Seconds: seconds,
            IsActive: true
        };
        let project = {
            _id: 1,
            ChannelAdSchedule: 1,
            Seconds: 1,
            BaseAmount: 1
        };
        let populateOptions = {
            path: 'ChannelAdSchedule',
            select: {
                TotalAvailableSeconds: 1
            },
            populate: [
                {
                    path: 'AdSchedule'
                }
            ]
        };
        ChannelPlan.find(query, project).populate(populateOptions).sort({'BaseAmount': 1}).exec((err, channelPlans) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                let channelAdScheduleIds = channelPlans.map(c => {
                    adScheduleMapping[c.ChannelAdSchedule._id.toString()] = {
                        AdSchedule: c.ChannelAdSchedule.AdSchedule,
                        ChannelAdSchedule: c.ChannelAdSchedule
                    };
                    return c.ChannelAdSchedule._id
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
                let project = {
                    DateTime: 1,
                    TotalSeconds: 1,
                    ChannelAdSchedule: 1
                };
                ChannelAdLengthCounter.find(query, project).sort({DateTime: 1}).exec((err, countsByDate) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    let result = {};

                    for (let i = startDate; i <= endDate; i = moment(i).add(1, 'days').toDate()) {
                        let key = _formatDate(i);
                        result[key] = {};
                        channelPlans.map((p) => {
                            if (p.ChannelAdSchedule && adScheduleMapping[p.ChannelAdSchedule._id.toString()]) {
                                // Dynamic price calculation
                                result[key][adScheduleMapping[p.ChannelAdSchedule._id.toString()].AdSchedule.Name] = {
                                    Plan: p._id,
                                    Name: p.Name,
                                    Description: p.Description,
                                    AdSchedule: p.ChannelAdSchedule.AdSchedule,
                                    Seconds: p.Seconds,
                                    BaseAmount: p.BaseAmount,
                                };
                            }
                        });
                    }

                    for (let i = 0; i < countsByDate.length; i++) {
                        let key = _formatDate(countsByDate[i].DateTime);
                        if (adScheduleMapping[countsByDate[i].ChannelAdSchedule.toString()] && adScheduleMapping[countsByDate[i].ChannelAdSchedule.toString()].ChannelAdSchedule) {
                            let totalAvailableSeconds = adScheduleMapping[countsByDate[i].ChannelAdSchedule.toString()].ChannelAdSchedule.TotalAvailableSeconds;
                            if ((totalAvailableSeconds < seconds + countsByDate[i].TotalSeconds)) {
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
                        data: result
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
        let dates = [];
        for (let i = clientAdPlan.StartDate; i <= clientAdPlan.EndDate; i = moment(i).add(7, 'days').toDate()) {
            dates.push(i);
        }
        let queue = dates.map(d => _updateChannelAdLengthByDate(clientAdPlan, d));
        try {
            let result = await Promise.all(queue);
            resolve();
        } catch (err) {
            return reject({
                code: err.code,
                error: err.error
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
        let splitStartDate = startDateString.split('-');
        let splitEndDate = endDateString.split('-');
        let startDate = new Date(parseInt(splitStartDate[0]), parseInt(splitStartDate[1]) - 1, parseInt(splitStartDate[2]), 0, 0, 0);
        let endDate = new Date(parseInt(splitEndDate[0]), parseInt(splitEndDate[1]) - 1, parseInt(splitEndDate[2]), 0, 0, 0);
        let query = {
            Channel: channel,
            IsActive: true
        };
        let project = {
            ChannelAdSchedule: 1
        };
        ChannelPlan.find(query, project).distinct('ChannelAdSchedule').exec((err, channelPlans) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            let channelAdScheduleIds = channelPlans.map(cp => cp);
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
            let project = {
                DateTime: 1,
                TotalSeconds: 1
            };
            ChannelAdLengthCounter.find(query, project).populate('ChannelAdSchedule', 'TotalAvailableSeconds').sort({DateTime: 1}).exec((err, countsByDate) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                let result = {};

                for (let i = startDate; i <= endDate; i = moment(i).add(1, 'days').toDate()) {
                    result[_formatDate(i)] = [];
                }
                for (let i = 0; i < countsByDate.length; i++) {
                    let key = _formatDate(countsByDate[i].DateTime);
                    if (countsByDate[i].ChannelAdSchedule && (countsByDate[i].ChannelAdSchedule.TotalAvailableSeconds < seconds + countsByDate[i].TotalSeconds)) {
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

const _updateChannelAdLengthByDate = (clientAdPlan, dateTime) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            Channel: clientAdPlan.ChannelPlan.Plan.Channel,
            ChannelAdSchedule: clientAdPlan.ChannelPlan.Plan.ChannelAdSchedule,
            DateTime: dateTime
        };
        let value = {
            Channel: clientAdPlan.ChannelPlan.Plan.Channel,
            ChannelAdSchedule: clientAdPlan.ChannelPlan.Plan.ChannelAdSchedule,
            DateTime: dateTime,
            $inc: {
                TotalSeconds: clientAdPlan.ChannelPlan.Plan.Seconds
            }
        };
        ChannelAdLengthCounter.findOneAndUpdate(query, value, {upsert: true}, (err) => {
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

const _formatDate = (date) => {
    let month = date.getMonth() + 1;
    let day = date.getDate();
    return date.getFullYear() + '-' + (month > 9 ? month : ('0' + month)) + '-' + (day > 9 ? day : ('0' + day));
};

module.exports = {
    getChannels,
    getSecondsByChannel,
    getPlansByChannel,
    updateChannelAdLengthCounter,
    getChannelScheduleAvailability
};