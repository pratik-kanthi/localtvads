const ChannelPlan = require.main.require('./models/ChannelPlan');
const Channel = require.main.require('./models/Channel');

/**
 * get Channels
 * @param {Object} location (optional) - Location of the channel in lat longs
 */
// TODO - GeoQuery $near
const getChannels = (location) => {
    return new Promise(async (resolve, reject) => {
        let query = {};
        Channel.find(query, (err, channels) => {
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
 * @param {Number} seconds - Total seconds of the plan
 */
const getChannelPlans = (channel, seconds) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            _id: channel,
            Seconds: seconds,
            IsActive: true
        };
        let project = {
            _id: 1,
            AdSchedule: 1,
            IsActive: true,
        };
        ChannelPlan.find(query, project).populate('AdSchedule').exec((err, channelPlans) => {
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