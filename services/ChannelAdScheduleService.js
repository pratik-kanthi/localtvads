const ChannelAdSchedule = require.main.require('./models/ChannelAdSchedule').model;

const saveChannelAdSchedule = (channeladschedule) => {
    return new Promise(async (resolve, reject) => {
        if (!channeladschedule.Channel || !channeladschedule.AdSchedule) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }

        const ch_ad_sch = new ChannelAdSchedule(channeladschedule);
        ch_ad_sch.save((err, saved) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            }

            resolve({
                code: 200,
                data: saved,
            });
        });
    });
};

module.exports = {
    saveChannelAdSchedule,
};
