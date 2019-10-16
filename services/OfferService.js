const Offer = require.main.require('./models/Offer').model;

const getApplicableOffers = (channel, adSchedule, startDate, project = {}) => {
    return new Promise(async (resolve, reject) => {
        const query = _generateOfferQuery(channel, adSchedule, startDate);
        Offer.find(query, project, (err, offers) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: offers
            });
        });
    });
};

const _generateOfferQuery = (channel, adSchedule, startDate) => {
    const query = {
        $and: []
    };
    if (channel) {
        query.$and.push({
            $or: [
                {
                    Channels: {
                        $in: [channel]
                    }
                },
                {
                    Channels: {
                        $exists: false
                    }
                },
                {
                    Channels: []
                }
            ]
        });
    }
    if (adSchedule) {
        query.$and.push({
            $or: [
                {
                    AdSchedules: {
                        $in: [adSchedule]
                    }
                },
                {
                    AdSchedules: {
                        $exists: false
                    }
                },
                {
                    AdSchedules: []
                }
            ]
        });
    }
    if (startDate) {
        query.$and.push({
            $and: [{
                StartDate: {
                    $lte: new Date(startDate)
                }
            }, {
                EndDate: {
                    $gte: new Date(startDate)
                }
            }]
        });
    }
    return query;
};

module.exports = {
    getApplicableOffers
};
