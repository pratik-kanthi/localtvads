const email = require('../email');
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const Client = require.main.require('./models/Client').model;
const Staff = require.main.require('./models/Staff').model;
const User = require.main.require('./models/User').model;
const UserClaim = require.main.require('./models/UserClaim').model;


const getClient = (clientid) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!clientid) {
                return reject({
                    code: 400,
                    data: utilities.ErrorMessages.BAD_REQUEST,
                });
            } else {
                const query = {
                    _id: clientid,
                };

                const plans = await ClientAdPlan.find({
                    Client: clientid,
                }).exec();
                const client = await Client.findOne(query).exec();

                const c = {};
                c.clientads = plans;
                c.clientinfo = client;

                resolve({
                    code: 200,
                    data: c,
                });
            }
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }

    });
};

const addStaff = (new_staff) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!new_staff.Email || !new_staff.Name) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }

            let result = null;
            try {
                result = await _isExists(Staff, {
                    Email: new_staff.Email,
                });
            } catch (ex) {
                return reject({
                    code: ex.code,
                    error: ex.error,
                });
            }

            if (result) {
                return reject({
                    code: 409,
                    error: {
                        message: utilities.ErrorMessages.USER_ALREADY_EXISTS,
                    },
                });
            }

            const staff = new Staff({
                Name: new_staff.Name,
                Email: new_staff.Email,
                Phone: new_staff.Phone,
                IsActive: true,
            });

            staff.save((err) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
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
                            Email: new_staff.Email,
                        },
                    });

                    const userPass = _generatePassword(8);
                    user.PasswordHash = user.EncryptPassword(userPass);
                    user.save((err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err,
                            });
                        }
                        const claim = new UserClaim({
                            UserId: user._id,
                            ClaimType: 'Staff',
                            ClaimValue: staff._id,
                        });
                        claim.save((err) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err,
                                });
                            }

                            const verification_link = process.env.APP + 'api/auth/confirmation/' + user._id;
                            email.helper.staffRegisterEmail(user.Email, verification_link, userPass);

                            resolve({
                                code: 200,
                                data: user,
                            });
                        });
                    });
                }
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }

    });
};


const _isExists = (Model, query) => {
    return new Promise(async (resolve, reject) => {
        Model.countDocuments(query, (err, user) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
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

module.exports = {
    getClient,
    addStaff
};