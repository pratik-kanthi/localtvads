const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ClientAd = require.main.require('./models/ClientAd').model;
const Client = require.main.require('./models/Client').model;


const approveAd = (id) => {
    return new Promise(async (resolve, reject) => {

        if (!id) {
            return reject({
                code: 400,
                error: utilities.ErrorMessages.BAD_REQUEST
            });
        } else {
            const query = {
                _id: id
            };
            ClientAd.findOne(query, (err, clientad) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                if (!clientad) {
                    return reject({
                        code: 400,
                        error: utilities.ErrorMessages.BAD_REQUEST
                    });
                } else {
                    clientad.Status = 'APPROVED';
                    clientad.save((err, cad) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }
                        resolve({
                            code: 200,
                            data: cad
                        });
                    });
                }
            });
        }
    });
};

const getAllAds = () => {
    return new Promise(async (resolve, reject) => {

        const projection = {
            _id: 1,
            Status: 1,
            VideoUrl: 1,
            Length: 1,
            Client: 1
        };

        const populateOptions = [
            {
                path: 'Client',
                select: {
                    Name: 1,
                    Email: 1,
                    ImageUrl: 1
                }
            }
        ];

        ClientAd.find({}, projection).populate(populateOptions).exec((err, ads) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });

            } else {
                resolve({
                    code: 200,
                    data: ads
                });
            }
        });
    });
};

const getAllClients = () => {
    return new Promise(async (resolve, reject) => {
        const projection = {};

        Client.find({}, projection).exec((err, clients) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                resolve({
                    code: 200,
                    data: clients
                });
            }
        });
    });
};

const getClient = (clientid) => {
    return new Promise(async (resolve, reject) => {
        if (!clientid) {

            return reject({
                code: 400,
                data: utilities.ErrorMessages.BAD_REQUEST
            });

        } else {

            const query = {
                _id: clientid
            };

            Client.findOne(query, (err, client) => {

                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                if (!client) {
                    return reject({
                        code: 404,
                        error: {
                            message: utilities.ErrorMessages.CLIENT_NOT_FOUND
                        }
                    });
                }

                resolve({
                    code: 200,
                    data: client
                });
            });
        }
    });
};

const getAd = (id) => {
    return new Promise(async (resolve, reject) => {

        const query = {
            ClientAd: id
        };


        const populateOptions = [
            {
                path: 'Client',
                model: 'Client'
            },
            {
                path: 'ClientAd',
                model: 'ClientAd'
            },
            {
                path: 'ChannelPlan.Plan.Channel',
                model: 'Channel',

            },
            {
                path: 'ChannelPlan.Plan.ChannelAdSchedule',
                model: 'ChannelAdSchedule',
                select: {
                    ChannelAdSchedule: 1
                },
                populate: [
                    {
                        path: 'AdSchedule',
                        model: 'AdSchedule',
                        select: {
                            Name: 1,
                            Description: 1,
                            StartTime: 1,
                            EndTime: 1
                        }
                    }
                ]
            }
        ];

        ClientAdPlan.findOne(query).populate(populateOptions).exec((err, ad) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });

            } else {
                resolve({
                    code: 200,
                    data: ad
                });
            }
        });
    });
};

const rejectAd = (id) => {
    return new Promise(async (resolve, reject) => {

        const query = {
            _id: id
        };

        ClientAd.findOne(query, (err, clientad) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            if (!clientad) {
                return reject({
                    code: 400,
                    error: utilities.ErrorMessages.BAD_REQUEST
                });
            } else {
                clientad.Status = 'REJECTED';
                clientad.save((err, cad) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }

                    resolve({
                        code: 200,
                        data: cad
                    });
                });
            }
        });

    });
};

module.exports = {
    approveAd,
    getAd,
    getAllAds,
    getAllClients,
    getClient,
    rejectAd
};