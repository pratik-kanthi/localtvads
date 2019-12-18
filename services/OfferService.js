const Offer = require.main.require('./models/Offer').model;

const getApplicableOffers = (channel, adSchedule, startDate, project = {}) => {
    return new Promise(async (resolve, reject) => {
        if (!startDate) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
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

const getAllOffers = (startDate, project = {
    Name: 1,
    Description: 1,
    StartDate: 1,
    EndDate: 1,
    Amount: 1,
    AmountType: 1,
    ImageUrl: 1
}) => {
    return new Promise(async (resolve, reject) => {
        if (!startDate) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            $and: []
        };
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
    query.$and.push({
        ApplyToBooking: true
    });
    return query;
};


const getAllOffersForStaff = () => {
    return new Promise(async (resolve, reject) => {
        const query = {};
        Offer.find(query).populate('Channels AdSchedules').exec((err, offers) => {
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

module.exports = {
    getApplicableOffers,
    getAllOffers,
    getAllOffersForStaff
};
