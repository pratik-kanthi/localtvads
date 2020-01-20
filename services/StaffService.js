const email = require('../email');
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ClientAd = require.main.require('./models/ClientAd').model;
const Client = require.main.require('./models/Client').model;
const Staff = require.main.require('./models/Staff').model;
const User = require.main.require('./models/User').model;
const UserClaim = require.main.require('./models/UserClaim').model;

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
            Name: 1,
            Client: 1,
            ClientAd: 1,
            StartDate: 1,
            DayOfWeek: 1,
            ChannelPlan: 1,
            Status: 1,
            BookedDate: 1
        };

        const populateOptions = [{
            path: 'Client',
            select: {
                Name: 1,
            }
        },
        {
            path: 'ClientAd',
            select: {
                Status: 1,
                Length: 1
            },

        },
        {
            path: 'ChannelPlan.Plan.Channel',
            model: 'Channel',
            select: {
                Name: 1,
                Description: 1
            }
        },
        {
            path: 'ChannelPlan.Plan.ChannelAdSchedule',
            model: 'ChannelAdSchedule',
            select: {
                _id: 1
            },
            populate: [{
                path: 'AdSchedule',
                model: 'AdSchedule',
                select: {
                    Name: 1,
                    Description: 1,
                    StartTime: 1,
                    EndTime: 1
                }
            }]
        }
        ];


        ClientAdPlan.find({}, projection).skip().limit().populate(populateOptions).exec((err, caps) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }

            resolve({
                code: 200,
                data: caps
            });
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
            const populateOptions = [{
                path: 'Client',
                select: {
                    Name: 1,
                }
            },
            {
                path: 'ClientAd',
                select: {
                    Status: 1,
                    Length: 1
                },

            },
            {
                path: 'ChannelPlan.Plan.Channel',
                model: 'Channel',
                select: {
                    Name: 1,
                    Description: 1
                }
            },
            {
                path: 'ChannelPlan.Plan.ChannelAdSchedule',
                model: 'ChannelAdSchedule',
                select: {
                    _id: 1
                },
                populate: [{
                    path: 'AdSchedule',
                    model: 'AdSchedule',
                    select: {
                        Name: 1,
                        Description: 1,
                        StartTime: 1,
                        EndTime: 1
                    }
                }]
            }
            ];
            ClientAdPlan.find({
                Client: clientid
            }).populate(populateOptions).exec((err, cad) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });

                } else {
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

                        const c = {};
                        c.clientads = cad;
                        c.clientinfo = client;

                        resolve({
                            code: 200,
                            data: c
                        });
                    });
                }
            });


        }
    });
};

const getAd = (id) => {
    return new Promise(async (resolve, reject) => {

        const query = {
            ClientAd: id
        };


        const populateOptions = [{
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
            populate: [{
                path: 'AdSchedule',
                model: 'AdSchedule',
                select: {
                    Name: 1,
                    Description: 1,
                    StartTime: 1,
                    EndTime: 1
                }
            }]
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

const addStaff = (new_staff) => {
    return new Promise(async (resolve, reject) => {
        if (!new_staff.Email || !new_staff.Name) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        let result = null;
        try {
            result = await _isExists(Staff, {
                Email: new_staff.Email
            });

        } catch (ex) {
            return reject({
                code: ex.code,
                error: ex.error
            });
        }

        if (result) {
            return reject({
                code: 409,
                error: {
                    message: utilities.ErrorMessages.USER_ALREADY_EXISTS
                }
            });
        }

        const staff = new Staff({
            Name: new_staff.Name,
            Email: new_staff.Email,
            Phone: new_staff.Phone,
            IsActive: true
        });

        staff.save((err) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                const user = new User({
                    UserName: new_staff.Email,
                    Name: new_staff.Name,
                    Email: new_staff.Email,
                    AuthorisationScheme: 'Standard',
                    IsEmailConfirmed: false,
                    IsLockoutEnabled: false,
                    Owner: {
                        Type: 'Staff',
                        _id: staff._id.toString(),
                        Title: new_staff.Name,
                        Email: new_staff.Email
                    }
                });

                const userPass = _generatePassword(8);
                user.PasswordHash = user.EncryptPassword(userPass);
                user.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    const claim = new UserClaim({
                        UserId: user._id,
                        ClaimType: 'Staff',
                        ClaimValue: staff._id
                    });
                    claim.save((err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }

                        const verification_link = process.env.APP + 'api/auth/confirmation/' + user._id;
                        email.helper.staffRegisterEmail(user.Email, verification_link, userPass);

                        resolve({
                            code: 200,
                            data: user
                        });
                    });
                });

            }
        });
    });
};

const getAllStaff = () => {
    return new Promise(async (resolve, reject) => {
        const projection = {};
        Staff.find({}, projection).exec((err, staff) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                resolve({
                    code: 200,
                    data: staff
                });
            }
        });
    });
};
const _isExists = (Model, query) => {
    return new Promise(async (resolve, reject) => {
        Model.countDocuments(query, (err, user) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve(user);
        });
    });
};


const _generatePassword = (length) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+<>ABCDEFGHIJKLMNOP1234567890';
    let pass = '';
    for (let x = 0; x < length; x++) {
        const i = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(i);
    }
    return pass;

};

const fetchStaffsByPage = (page, size, sortby) => {
    return new Promise(async (resolve, reject) => {
        page = page - 1;

        Staff.find({}).skip(page * size).limit(size).sort(sortby).exec((err, staffs) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                resolve({
                    code: 200,
                    data: staffs
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
    rejectAd,
    addStaff,
    getAllStaff,
    fetchStaffsByPage
};