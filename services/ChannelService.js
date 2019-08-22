const config = require.main.require('./config');

const ChannelPlan = require.main.require('./models/ChannelPlan').model;
const Channel = require.main.require('./models/Channel').model;

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
 * get active plans of the channel
 * @param {String} channel - _id of the channel
 * @param {Number} seconds - _id of the channel
 */
const getPlansByChannel = (channel, seconds) => {
    return new Promise(async (resolve, reject) => {
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

const getNearByChannelPlans = (channel, seconds) => {
    return new Promise(async (resolve, reject) => {
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
                Channel.find(query,project, async (err, channels) => {
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

module.exports = {
    getChannels,
    getPlansByChannel,
    getNearByChannelPlans
};