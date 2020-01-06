const Offer = require.main.require('./models/Offer').model;
const FileService = require.main.require('./services/FileService');

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

const saveOffer = (offerObj) => {
    return new Promise(async (resolve, reject) => {
        if (!offerObj) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        new Offer(offerObj).save((err, offer) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: offer
            });
        });
    });
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

const getOffersByDuration = (startDate, endDate) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            $or: [
                {
                    $and: [
                        {
                            StartDate: {
                                $lte: new Date(startDate)
                            }
                        }, {
                            EndDate: {
                                $lte: new Date(startDate)
                            }
                        }
                    ]
                },
                {
                    $and: [
                        {
                            StartDate: {
                                $gte: new Date(startDate)
                            }
                        }, {
                            EndDate: {
                                $lte: new Date(endDate)
                            }
                        }
                    ]
                },
                {
                    $and: [
                        {
                            StartDate: {
                                $lte: new Date(endDate)
                            }
                        }, {
                            EndDate: {
                                $gte: new Date(endDate)
                            }
                        }
                    ]
                }
            ]
        };
        const projection = {
            _id: 1,
            Name: 1,
            ImageUrl: 1,
            StartDate: 1,
            EndDate: 1,
            Amount: 1,
            Description: 1,
            AdSchedules: 1,
            Channels: 1,
            DaysOfWeek: 1,
            AmountType: 1
        };
        const populateOptions = [
            {
                path: 'AdSchedules',
                select: {
                    Name: 1
                }
            },
            {
                path: 'Channels',
                select: {
                    Name: 1
                }
            }
        ];
        Offer.find(query, projection).populate(populateOptions).exec((err, offers) => {
            if (err) {
                return reject({
                    code: 400,
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

const deleteOffer = (offerId) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            _id: offerId
        };
        if (!offerId) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        Offer.findOneAndDelete(query).exec((err, data) => {
            if(err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            if(data){
                FileService.deleteBucketFile(data.ImageUrl);
                resolve({
                    code: 200,
                    data: 'Deleted'
                });
            }
        });
    });
};

module.exports = {
    getApplicableOffers,
    getAllOffers,
    getAllOffersForStaff,
    getOffersByDuration,
    saveOffer,
    deleteOffer
};
