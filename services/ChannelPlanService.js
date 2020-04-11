const ChannelPlan = require.main.require('./models/ChannelPlan').model;

const fetchChannelPlans = (channel) => {
    return new Promise(async (resolve, reject) => {
        const populateOptions = {
            path: 'ChannelAdSchedule',
            select: {
                TotalAvailableSeconds: 1,
                AdSchedule: 1,
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
                        EndTime: 1,
                    },
                },
            ],
        };
        ChannelPlan.find({
            Channel: channel,
        })
            .populate(populateOptions)
            .exec((err, cplans) => {
                if (err) {
                    return reject({
                        code: 200,
                        error: err,
                    });
                }

                resolve({
                    code: 200,
                    data: cplans,
                });
            });
    });
};

const saveChannelPlan = (channelPlan) => {
    return new Promise(async (resolve, reject) => {
        if (!channelPlan) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }

        const cplan = new ChannelPlan(channelPlan);
        cplan.save((err, saved) => {
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
    fetchChannelPlans,
    saveChannelPlan,
};
