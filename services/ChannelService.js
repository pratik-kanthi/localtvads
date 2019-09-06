const moment = require('moment');
const config = require.main.require('./config');

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
 */
const getPlansByChannel = (channel, seconds) => {
    return new Promise(async (resolve, reject) => {
        if (!channel || !seconds) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let query = {
            Channel: channel,
            Seconds: seconds,
            IsActive: true
        };
        let project = {
            _id: 1,
            AdSchedule: 1,
            Seconds: 1,
            DurationMonths: 1,
            BaseAmount: 1
        };
        ChannelPlan.find(query, project).populate('AdSchedule', 'Name ExpectedAdViews').sort('Seconds').exec((err, channelPlans) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                resolve({
                    code: 200,
                    data: channelPlans
                });
            }
        });
    });
};

/**
 * get active plans of the nearby channel
 * @param {String} channel - _id of the channel
 * @param {Number} seconds - number of seconds available in plans
 */
const getNearByChannelPlans = (channel, seconds) => {
    return new Promise(async (resolve, reject) => {
        if (!channel || !seconds) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let query = {
            _id: channel,
            Status: "LIVE"
        };
        let project = {
            "Address.Location.coordinates": 1
        };
        Channel.findOne(query, project, (err, channel) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                })
            } else if (!channel) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Channel' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                query = {
                    "Address.Location": {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: channel.Address.Location.coordinates
                            },
                            $maxDistance: config.channels.nearby
                        }
                    },
                    "Status": "LIVE"
                };
                project = {
                    _id: 1,
                    Name: 1
                };
                Channel.find(query, project, async (err, channels) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    } else if (!channels) {
                        return reject({
                            code: 200,
                            data: []
                        });
                    } else {
                        for (let i = 0; i < channels.length; i++) {
                            channels[i] = channels[i].toObject();
                            try {
                                channels[i].Plans = (await getPlansByChannel(channels[i]._id, seconds)).data;
                            } catch (err) {
                                return reject({
                                    code: err.code,
                                    error: err.error
                                });
                            }
                            if (i === channels.length - 1) {
                                resolve({
                                    code: 200,
                                    data: channels
                                });
                            }
                        }
                    }
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

const getChannelScheduleAvailability = (channel, second) => {
    return new Promise(async (resolve, reject) => {
        resolve();
    });
};

const _updateChannelAdLengthByDate = (clientAdPlan, dateTime) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            Channel: clientAdPlan.ChannelPlan.Plan.Channel,
            AdSchedule: clientAdPlan.ChannelPlan.Plan.AdSchedule,
            DateTime: dateTime
        };
        let value = {
            Channel: clientAdPlan.ChannelPlan.Plan.Channel,
            AdSchedule: clientAdPlan.ChannelPlan.Plan.AdSchedule,
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

module.exports = {
    getChannels,
    getSecondsByChannel,
    getPlansByChannel,
    getNearByChannelPlans,
    updateChannelAdLengthCounter,
    getChannelScheduleAvailability
};