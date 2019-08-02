const jwt = require('jsonwebtoken');
const config = require.main.require('./config');

const User = require.main.require('./models/User').model;
const AccessToken = require.main.require('./models/AccessToken').model;

const socialAuth = (profile) => {
    return new Promise(async (resolve, reject) => {
        if (!profile || !profile.token) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else {
            let query = {
                UserName: profile.Email,
                AuthorisationScheme: profile.AuthorisationScheme
            };
            User.findOne(query, (err, user) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    })
                } else if (!user) {
                    return reject({
                        code: 404,
                        error: {
                            message: utilities.ErrorMessages.USERNAME_NOT_FOUND
                        }
                    })
                } else if (user && !user.EmailConfirmed) {
                    return reject({
                        code: 401,
                        error: {
                            message: utilities.ErrorMessages.EMAIL_NOT_CONFIRMED
                        }
                    })
                } else if (user && user.LockoutEnabled) {
                    return reject({
                        code: 401,
                        error: {
                            message: utilities.ErrorMessages.USER_LOCKED_OUT
                        }
                    })
                } else {
                    let accessToken = new AccessToken({
                        UserName: user.Email,
                        UserId: user._id,
                        AuthorisationScheme: user.AuthorisationScheme,
                        Owner: user.Owner,
                        iat: Math.floor(Date.now() / 1000) + config.token.ttl
                }).toObject();

                    jwt.sign(accessToken, config.token.secret, {algorithm: 'HS256'}, (err, token) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        } else {
                            accessToken.TokenString = token;
                            resolve({
                                code: 200,
                                data: accessToken
                            });
                        }
                    });
                }
            });
        }
    });
};

module.exports = {
    socialAuth
};