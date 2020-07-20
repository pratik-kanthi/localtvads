const ChannelPlan = require.main.require('./models/ChannelProduct').model;

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

        const cplan = new ChannelPlan(channelPlan);
        cplan.save((err) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            }

            ChannelPlan.findOne({ _id: cplan._id })
                .populate(populateOptions)
                .exec((err, c) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    resolve({
                        code: 200,
                        data: c,
                    });
                });
        });
    });
};

const updateChannelPlan = (channelPlan) => {
    return new Promise(async (resolve, reject) => {
        if (!channelPlan) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }

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

        ChannelPlan.findOneAndUpdate({ _id: channelPlan._id }, channelPlan)
            .populate(populateOptions)
            .exec((err, saved) => {
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

const deleteChannelPlan = (channelplanid) => {
    return new Promise(async (resolve, reject) => {
        if (!channelplanid) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }

        ChannelPlan.findOneAndDelete({ _id: channelplanid }).exec((err) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            }

            resolve({
                code: 200,
                data: true,
            });
        });
    });
};

module.exports = {
    fetchChannelPlans,
    saveChannelPlan,
    updateChannelPlan,
    deleteChannelPlan,
};
