const jwt = require('jsonwebtoken');
const email = require('../email');
const request = require('request');
const config = require.main.require('./config');
const AccessToken = require.main.require('./models/AccessToken').model;
const Client = require.main.require('./models/Client').model;
const User = require.main.require('./models/User').model;
const UserClaim = require.main.require('./models/UserClaim').model;
const UserLogin = require.main.require('./models/UserLogin').model;
const {
    uploadImage
} = require.main.require('./services/FileService');
const {
    addToSubscribers,
    addRegisteredUserTag
} = require.main.require('./services/MailChimpService');
const {
    standardRegisterEmail
} = require.main.require('./email/helper');



/**
 * Social Registration through Facebook and Google+
 * @param {Object} profile - Profile object returned by respective OAuth 2.0 social login
 */
const socialRegister = (profile) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!profile || !profile.token || !profile.Email || !profile.Name) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            } else {
                let count;
                try {
                    count = await _isExists(Client, {
                        Email: profile.Email,
                    });
                } catch (ex) {
                    return reject({
                        code: ex.code,
                        error: ex.error,
                    });
                }
                if (count) {
                    return reject({
                        code: 409,
                        error: {
                            message: utilities.ErrorMessages.USER_ALREADY_EXISTS,
                        },
                    });
                }
                const client = new Client({
                    Name: profile.Name,
                    Email: profile.Email,
                    Phone: profile.Phone,
                    IsActive: true,
                    ImageUrl: undefined,
                });
                if (profile.ImageUrl) {
                    try {
                        client.ImageUrl = await _fetchProfileImage(client, profile);
                    } catch (ex) {
                        logger.logError('Failed to fetch image url from social account', ex);
                        return reject({
                            code: ex.code || 500,
                            error: ex.error || ex,
                        });
                    }
                }
                client.save((err) => {
                    if (err) {
                        logger.logError('Failed to save client for new social account', err);
                        return reject({
                            code: 500,
                            error: err,
                        });
                    } else {
                        const user = new User({
                            UserName: profile.Email,
                            Name: profile.Name,
                            Email: profile.Email,
                            AuthorisationScheme: profile.AuthorisationScheme,
                            IsEmailConfirmed: true,
                            IsLockoutEnabled: false,
                            Owner: {
                                Type: 'Client',
                                _id: client._id.toString(),
                                Title: profile.Name,
                                Email: profile.Email,
                                ImageUrl: client.ImageUrl,
                            },
                        });
                        user.save((err) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err,
                                });
                            }
                            const claim = new UserClaim({
                                UserId: user._id,
                                ClaimType: 'Client',
                                ClaimValue: client._id,
                            });
                            claim.save((err) => {
                                if (err) {
                                    logger.logError('Failed to save new social account claim', err);
                                    return reject({
                                        code: 500,
                                        error: err,
                                    });
                                }
                                const accessToken = new AccessToken({
                                    UserName: user.Email,
                                    UserId: user._id,
                                    AuthorisationScheme: user.AuthorisationScheme,
                                    Owner: user.Owner,
                                    iat: Math.floor(Date.now() / 1000) + config.token.ttl,
                                    Claims: claim.ClaimType + ':' + claim.ClaimValue,
                                }).toObject();

                                email.helper.socialRegisterEmail(user.Email, user.AuthorisationScheme);

                                jwt.sign(
                                    accessToken,
                                    config.token.secret, {
                                        algorithm: 'HS256',
                                    },
                                    (err, token) => {
                                        if (err) {
                                            logger.logError(`Failed to sign token for registration ${profile.Email }`, err);
                                            return reject({
                                                code: 500,
                                                error: err,
                                            });
                                        } else {
                                            accessToken.TokenString = token;
                                            resolve({
                                                code: 200,
                                                data: accessToken,
                                            });
                                        }
                                    }
                                );
                            });
                        });
                    }
                });
            }
        } catch (err) {
            logger.logError(`Failed to register new social account for ${profile.Email }`, err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

/**
 * Standard Registration through Email and Password
 * @param {Object} profile - Profile object for standard registration
 */
const standardRegister = (profile) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!profile || !profile.Name || !profile.Password || !profile.Email) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/.test(profile.Password)) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.WEAK_PASSWORD,
                    },
                });
            }
            let result;
            try {
                result = await _isExists(Client, {
                    Email: profile.Email,
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

            const client = new Client({
                Name: profile.Name,
                Email: profile.Email,
                Phone: profile.Phone,
                IsActive: true,
                IsSubscribed: profile.IsSubscribed,
            });
            client.save((err) => {
                if (err) {
                    logger.logError('Failed to register new client account', err);
                    return reject({
                        code: 500,
                        error: err,
                    });
                } else {
                    const user = new User({
                        UserName: profile.Email,
                        Name: profile.Name,
                        Email: profile.Email,
                        AuthorisationScheme: profile.AuthorisationScheme,
                        IsEmailConfirmed: false,
                        IsLockoutEnabled: false,
                        Owner: {
                            Type: 'Client',
                            _id: client._id.toString(),
                            Title: profile.Name,
                            Email: profile.Email,
                        },
                    });
                    user.PasswordHash = user.EncryptPassword(profile.Password);
                    user.save((err) => {
                        if (err) {
                            logger.logError('Failed to register new user account', err);
                            return reject({
                                code: 500,
                                error: err,
                            });
                        }
                        const claim = new UserClaim({
                            UserId: user._id,
                            ClaimType: 'Client',
                            ClaimValue: client._id,
                        });
                        claim.save(async (err) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err,
                                });
                            }

                            const verification_link = process.env.APP + 'api/auth/confirmation/' + user._id;
                            email.helper.standardRegisterEmail(user.Email, verification_link);

                            if (profile.IsSubscribed) {
                                await addToSubscribers(client.Email);
                                await addRegisteredUserTag(client.Email);
                            }

                            resolve({
                                code: 200,
                                data: user,
                            });
                        });
                    });
                }
            });

        } catch (err) {
            logger.logError('Failed to register new client account', err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

/**
 * Social Login
 * @param {Object} profile - Profile object returned by respective OAuth 2.0 social login
 * @param {Object} req - request of the API
 */
const socialLogin = (profile, req) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!profile || !profile.token) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            } else {
                const query = {
                    UserName: profile.Email,
                };
                User.findOne(query, async (err, user) => {
                    if (err) {

                        logger.logError('API ERROR', err);
                        return reject({
                            code: 500,
                            error: err,
                        });
                    } else if (!user) {
                        logger.logError('Failed login', err);
                        return reject({
                            code: 404,
                            error: {
                                message: utilities.ErrorMessages.USERNAME_NOT_FOUND,
                            },
                        });
                    } else if (user && user.IsLockoutEnabled) {
                        logger.logError('Failed login', err);
                        return reject({
                            code: 401,
                            error: {
                                message: utilities.ErrorMessages.USER_LOCKED_OUT,
                            },
                        });
                    } else if (user && user.PasswordHash) {
                        logger.logError('Failed login', err);
                        return reject({
                            code: 409,
                            error: {
                                message: utilities.ErrorMessages.INVALID_AUTHORISATION_TYPE,
                            },
                        });
                    }
                    let claims;
                    try {
                        claims = await _fetchClaim(user._id);
                    } catch (ex) {
                        _logLogin(profile.Email, req, 'FAILED_LOGIN');
                        return reject({
                            code: ex.code || 500,
                            error: ex.error,
                        });
                    }
                    const claimsValue = claims.map((i) => i.ClaimType + ':' + i.ClaimValue).join('|');

                    const accessToken = new AccessToken({
                        UserName: user.Email,
                        UserId: user._id,
                        AuthorisationScheme: user.AuthorisationScheme,
                        Owner: user.Owner,
                        iat: Math.floor(Date.now() / 1000) + config.token.ttl,
                        Claims: claimsValue,
                    }).toObject();

                    jwt.sign(
                        accessToken,
                        config.token.secret, {
                            algorithm: 'HS256',
                        },
                        (err, token) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err,
                                });
                            } else {
                                accessToken.TokenString = token;
                                resolve({
                                    code: 200,
                                    data: accessToken,
                                });
                            }
                        }
                    );
                });
            }
        } catch (err) {
            logger.logError('Failed to login with social account', err);
            return reject({
                code: 500,
                error: err,
            });
        }

    });
};

/**
 * Standard Login
 * @param {String} email - Email ID of the user
 * @param {String} password - Password of the user
 * @param {Object} req - request of the API
 */
const standardLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {

            if (!email || !password) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                UserName: email,
                AuthorisationScheme: 'Standard',
            };
            User.findOne(query, async (err, user) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                } else if (!user) {
                    logger.logError('Failed login', err);
                    return reject({
                        code: 404,
                        error: {
                            message: utilities.ErrorMessages.USERNAME_NOT_FOUND,
                        },
                    });
                } else {
                    if (user.ValidatePassword(password, user.PasswordHash)) {
                        if (user && !user.IsEmailConfirmed) {
                            logger.logWarning('Email unverified', err);
                            return reject({
                                code: 403,
                                error: {
                                    message: utilities.ErrorMessages.EMAIL_NOT_CONFIRMED,
                                },
                            });
                        } else if (user && user.IsLockoutEnabled) {
                            return reject({
                                code: 401,
                                error: {
                                    message: utilities.ErrorMessages.USER_LOCKED_OUT,
                                },
                            });
                        } else {
                            let claims;
                            try {
                                claims = await _fetchClaim(user._id);
                            } catch (ex) {
                                logger.logError('Failed login', err);
                                return reject({
                                    code: ex.code || 500,
                                    error: ex.error,
                                });
                            }
                            const claimsValue = claims.map((i) => i.ClaimType + ':' + i.ClaimValue).join('|');

                            const accessToken = new AccessToken({
                                UserName: user.Email,
                                UserId: user._id,
                                AuthorisationScheme: user.AuthorisationScheme,
                                Owner: user.Owner,
                                Phone: user.Phone,
                                iat: Math.floor(Date.now() / 1000) + config.token.ttl,
                                Claims: claimsValue,
                            }).toObject();

                            jwt.sign(
                                accessToken,
                                config.token.secret, {
                                    algorithm: 'HS256',
                                },
                                (err, token) => {
                                    if (err) {
                                        logger.logError('Failed login', err);
                                        return reject({
                                            code: 500,
                                            error: err,
                                        });
                                    } else {
                                        accessToken.TokenString = token;
                                        resolve({
                                            code: 200,
                                            data: accessToken,
                                        });
                                    }
                                }
                            );
                        }
                    } else {
                        logger.logError('Failed login', err);
                        return reject({
                            code: 401,
                            error: {
                                message: utilities.ErrorMessages.PASSWORD_INCORRECT,
                            },
                        });
                    }
                }
            });
        } catch (err) {
            logger.logError('Failed to login', err);
            return reject({
                code: 500,
                error: err
            });
        }

    });
};

/**
 * Portal Login
 * @param {String} email - Email ID of the user
 * @param {String} password - Password of the user
 * @param {Object} req - request of the API
 */
const portalLogin = (email, password, req) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!email || !password) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                UserName: email,
                AuthorisationScheme: 'Standard',
            };
            User.findOne(query, async (err, user) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                } else if (!user) {
                    _logLogin(email, req, 'FAILED_LOGIN');
                    return reject({
                        code: 404,
                        error: {
                            message: utilities.ErrorMessages.USERNAME_NOT_FOUND,
                        },
                    });
                } else {
                    if (user.ValidatePassword(password, user.PasswordHash)) {
                        if (user && !user.IsEmailConfirmed) {
                            _logLogin(email, req, 'EMAIL_UNVERIFIED');
                            return reject({
                                code: 401,
                                error: {
                                    message: utilities.ErrorMessages.EMAIL_NOT_CONFIRMED,
                                },
                            });
                        } else if (user && user.IsLockoutEnabled) {
                            _logLogin(email, req, 'FAILED_LOGIN');
                            return reject({
                                code: 401,
                                error: {
                                    message: utilities.ErrorMessages.USER_LOCKED_OUT,
                                },
                            });
                        } else {
                            let claims;
                            try {
                                claims = await _fetchClaim(user._id);
                            } catch (ex) {
                                _logLogin(email, req, 'FAILED_LOGIN');
                                return reject({
                                    code: ex.code || 500,
                                    error: ex.error,
                                });
                            }
                            const claimsValue = claims.map((i) => i.ClaimType + ':' + i.ClaimValue).join('|');
                            if (claimsValue.indexOf('Client') > -1) {
                                return reject({
                                    code: 400,
                                    error: {
                                        message: utilities.ErrorMessages.BAD_REQUEST,
                                    },
                                });
                            }
                            const accessToken = new AccessToken({
                                UserName: user.Email,
                                UserId: user._id,
                                AuthorisationScheme: user.AuthorisationScheme,
                                Owner: user.Owner,
                                Phone: user.Phone,
                                iat: Math.floor(Date.now() / 1000) + config.token.ttl,
                                Claims: claimsValue,
                            }).toObject();

                            jwt.sign(
                                accessToken,
                                config.token.secret, {
                                    algorithm: 'HS256',
                                },
                                (err, token) => {
                                    if (err) {
                                        return reject({
                                            code: 500,
                                            error: err,
                                        });
                                    } else {
                                        accessToken.TokenString = token;
                                        resolve({
                                            code: 200,
                                            data: accessToken,
                                        });
                                    }
                                }
                            );
                            _logLogin(email, req, 'SUCCESS');
                        }
                    } else {
                        _logLogin(email, req, 'FAILED_LOGIN');
                        return reject({
                            code: 401,
                            error: {
                                message: utilities.ErrorMessages.PASSWORD_INCORRECT,
                            },
                        });
                    }
                }
            });
        } catch (err) {
            logger.logError('Failed to login', err);
            return reject({
                code: 500,
                error: err
            });
        }

    });
};

/**
 * Set IsEmailConfirmed to true for the user
 * @param {String} userid  - _id of the User
 */
const verifyUserEmail = (userid) => {
    return new Promise(async (resolve, reject) => {

        try {
            if (!userid) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            } else {
                const query = {
                    _id: userid,
                };

                User.findOne(query, async (err, user) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    } else {
                        user.IsEmailConfirmed = true;
                        user.save((err) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err,
                                });
                            } else {
                                resolve({
                                    code: 200,
                                    data: user,
                                });
                            }
                        });
                    }
                });
            }
        } catch (err) {
            logger.logError('Failed to verify user account', err);
            return reject({
                code: 500,
                error: err
            });
        }


    });
};

const sendPasswordResetLink = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userEmail) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            } else {
                const query = {
                    Email: userEmail,
                };

                User.findOne(query, async (err, user) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    } else if (!user || user.AuthorisationScheme !== 'Standard') {
                        return reject({
                            code: 401,
                            error: {
                                message: utilities.ErrorMessages.EMAIL_NOT_REGISTERED,
                            },
                        });
                    } else {
                        const utcstamp = Date.parse(new Date());
                        let verification_link = user._id + 'UTC' + utcstamp;
                        verification_link = process.env.WEBAPP + 'resetpassword?token=' + Buffer.from(verification_link).toString('base64');
                        email.helper.passwordResetEmail(user.Email, verification_link);

                        resolve({
                            code: 200,
                            data: true,
                        });
                    }
                });
            }
        } catch (err) {
            logger.logError('Failed to send password reset link', err);
            return reject({
                code: 500,
                error: err
            });
        }

    });
};

const resetPassword = (hash, newpassword) => {
    return new Promise(async (resolve, reject) => {

        try {
            if (!hash) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            } else {
                let hashstring = Buffer.from(hash, 'base64').toString();
                hashstring = hashstring.split('UTC');
                const utcnow = Date.parse(new Date());
                const userid = hashstring[0];
                const linktimestamp = hashstring[1];

                if (utcnow - parseInt(linktimestamp) > 86400) {
                    return reject({
                        code: 401,
                        error: {
                            message: utilities.ErrorMessages.PASSWORD_LINK_EXPIRED,
                        },
                    });
                } else {
                    const query = {
                        _id: userid,
                    };
                    User.findOne(query, async (err, user) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err,
                            });
                        } else if (user) {
                            user.PasswordHash = user.EncryptPassword(newpassword);
                            user.save((err) => {
                                if (err) {
                                    return reject({
                                        code: 500,
                                        error: err,
                                    });
                                } else {
                                    resolve({
                                        code: 200,
                                        data: true,
                                    });
                                }
                            });
                        }
                    });
                }
            }
        } catch (err) {
            logger.logError('Failed to reset password', err);
            return reject({
                code: 500,
                error: err
            });
        }


    });
};

const changePassword = (password, user) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!password || !user._id) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }

            User.findOne({
                _id: user._id,
            }).exec((err, user) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }

                if (!user) {
                    return reject({
                        code: 400,
                        error: {
                            message: utilities.ErrorMessages.USERNAME_NOT_FOUND,
                        },
                    });
                }

                user.PasswordHash = user.EncryptPassword(password);
                user.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    } else {
                        resolve({
                            code: 200,
                            data: true,
                        });
                    }
                });
            });
        } catch (err) {
            logger.logError('Failed to change password', err);
            return reject({
                code: 500,
                error: err
            });
        }

    });
};

const sendVerificationEmail = (email) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!email) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                UserName: email,
            };
            User.findOne(query, async (err, user) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                } else {
                    const verification_link = process.env.APP + 'api/auth/confirmation/' + user._id.toString();
                    standardRegisterEmail(user.Email, verification_link);

                    resolve({
                        code: 200,
                        data: 'Verification link sent, please check your email',
                    });
                }
            });
        } catch (err) {
            logger.logError('Failed to send account verification email', err);
            return reject({
                code: 500,
                error: err
            });
        }

    });
};

const _isExists = (Model, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            Model.countDocuments(query, (err, user) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                resolve(user);
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const _logLogin = (email, req, status) => {
    const _userLogin = new UserLogin();
    _userLogin.UserName = email;
    _userLogin.UserIP = req.ip;
    _userLogin.Status = status;
    _userLogin.save();
};

const _fetchClaim = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = {
                UserId: userId,
            };
            UserClaim.find(query, (err, claims) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                resolve(claims);
            });
        } catch (err) {
            logger.logError(`Failed to fetch claims for ${email}`, err);
            return reject({
                code: 500,
                error: err
            });
        }

    });
};

const _fetchProfileImage = (client, profile) => {
    return new Promise(async (resolve, reject) => {
        try {
            const extension = profile.AuthorisationScheme === 'Google' ? profile.ImageUrl.substr(profile.ImageUrl.lastIndexOf('.')) : '.jpg';
            const dst = 'uploads/Client/' + client._id.toString() + '/' + Date.now() + extension;
            const options = {
                url: profile.ImageUrl,
                method: 'GET',
                encoding: null,
            };
            request(options, (err, res, body) => {
                if (err || res.statusCode !== 200) {
                    return reject({
                        code: res.statusCode,
                        error: err,
                    });
                }
                uploadImage({
                    buffer: body,
                },
                dst
                ).then(
                    () => {
                        resolve(dst);
                    },
                    (err) => {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                );
            });
        } catch (err) {
            logger.logError(`Failed to fetch profile image for for ${client}`, err);
            return reject({
                code: 500,
                error: err
            });
        }


    });
};

module.exports = {
    portalLogin,
    socialLogin,
    socialRegister,
    standardLogin,
    standardRegister,
    verifyUserEmail,
    sendPasswordResetLink,
    resetPassword,
    changePassword,
    sendVerificationEmail,
};