const ChannelPlan = require.main.require('./models/ChannelPlan').model;
const Channel = require.main.require('./models/Channel').model;

/**
 * get Channels
 * @param {Object} location (optional) - Location of the channel in lat longs
 */
// TODO - GeoQuery $near
const getChannels = (location) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            Status: "LIVE"
        };
        let project = {
            "Name": 1,
            "Description": 1,
            "Address.Location": 1
        };
        Channel.find(query,project, (err, channels) => {
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
 */
const getChannelPlans = (channel) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            Channel: channel,
            IsActive: true
        };
        let project = {
            _id: 1,
            AdSchedule: 1,
            Seconds: 1,
            DurationMonths:1,
            IsActive: true,
            BaseAmount: 1
        };
        ChannelPlan.find(query, project).populate('AdSchedule','Name ExpectedAdViews').exec((err, channelPlans) => {
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

module.exports = {
    getChannels,
    getChannelPlans
};