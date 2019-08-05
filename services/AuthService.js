const jwt = require('jsonwebtoken');
const config = require.main.require('./config');

const AccessToken = require.main.require('./models/AccessToken').model;
const Client = require.main.require('./models/Client').model;
const User = require.main.require('./models/User').model;
const UserClaim = require.main.require('./models/UserClaim').model;
const UserLogin = require.main.require('./models/UserLogin').model;

const socialRegister = (profile) => {
    return new Promise(async (resolve, reject) => {
        if (!profile || !profile.token || !profile.Email || !profile.Name) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else {
            let count;
            try {
                count = await _isExists(Client, {Email: profile.Email});
            } catch (ex) {
                return reject({
                    code: ex.code,
                    error: ex.error
                });
            }
            if (count) {
                return reject({
                    code: 409,
                    error: {
                        message: utilities.ErrorMessages.USER_ALREADY_EXISTS
                    }
                })
            }
            let client = new Client({
                Name: profile.Name,
                Email: profile.Email,
                Phone: profile.Phone,
                IsActive: true
            });
            client.save((err) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                } else {
                    let user = new User({
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
                            Email: profile.Email
                        }
                    });
                    user.save((err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }
                        let claim = new UserClaim({
                            UserId: user._id,
                            ClaimType: 'Client',
                            ClaimValue: client._id
                        });
                        claim.save((err) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err
                                });
                            }
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
                        });
                    });
                }
            });
        }
    });
};

const standardRegister = (profile) => {
    return new Promise(async (resolve, reject) => {
        if (!profile || !profile.Name || !profile.Password || !profile.Email) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/.test(profile.Password)) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.WEAK_PASSWORD
                }
            })
        }
        let result;
        try {
            result = await _isExists(Client, {Email: profile.Email});
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

        let client = new Client({
            Name: profile.Name,
            Email: profile.Email,
            Phone: profile.Phone,
            IsActive: true
        });
        client.save((err) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                let user = new User({
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
                        Email: profile.Email
                    }
                });
                user.PasswordHash = user.EncryptPassword(profile.Password);
                user.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    let claim = new UserClaim({
                        UserId: user._id,
                        ClaimType: 'Client',
                        ClaimValue: client._id
                    });
                    claim.save((err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }
                        resolve({
                            code: 200,
                            data: user
                        })
                    });
                });
            }
        });
    });
};

const socialLogin = (profile, req) => {
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
            User.findOne(query, async (err, user) => {
                if (err) {
                    _logLogin(profile.Email, req, "API_ERROR");
                    return reject({
                        code: 500,
                        error: err
                    })
                } else if (!user) {
                    _logLogin(profile.Email, req, "FAILED_LOGIN");
                    return reject({
                        code: 404,
                        error: {
                            message: utilities.ErrorMessages.USERNAME_NOT_FOUND
                        }
                    })
                } else if (user && user.IsLockoutEnabled) {
                    _logLogin(profile.Email, req, "FAILED_LOGIN");
                    return reject({
                        code: 401,
                        error: {
                            message: utilities.ErrorMessages.USER_LOCKED_OUT
                        }
                    })
                }
                let claims;
                try {
                    claims = await _fetchClaim(user._id);
                } catch (ex) {
                    _logLogin(email, req, "FAILED_LOGIN");
                    return reject({
                        code: ex.code || 500,
                        error: ex.error
                    });
                }
                let claimsValue = claims.map(function (i) {
                    return i.ClaimType + ':' + i.ClaimValue;
                }).join("|");

                let accessToken = new AccessToken({
                    UserName: user.Email,
                    UserId: user._id,
                    AuthorisationScheme: user.AuthorisationScheme,
                    Owner: user.Owner,
                    iat: Math.floor(Date.now() / 1000) + config.token.ttl,
                    Claims: claimsValue
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
            });
        }
    });
};

const standardLogin = (email, password, req) => {
    return new Promise(async (resolve, reject) => {
        if (!email || !password) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let query = {
            UserName: email,
            AuthorisationScheme: 'Standard'
        };
        User.findOne(query, async (err, user) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!user) {
                _logLogin(email, req, "FAILED_LOGIN");
                return reject({
                    code: 404,
                    error: {
                        message: utilities.ErrorMessages.USERNAME_NOT_FOUND
                    }
                })
            } else {
                if (user.ValidatePassword(password, user.PasswordHash)) {
                    if (user && !user.IsEmailConfirmed) {
                        _logLogin(email, req, "EMAIL_UNVERIFIED");
                        return reject({
                            code: 401,
                            error: {
                                message: utilities.ErrorMessages.EMAIL_NOT_CONFIRMED
                            }
                        })
                    } else if (user && user.IsLockoutEnabled) {
                        _logLogin(email, req, "FAILED_LOGIN");
                        return reject({
                            code: 401,
                            error: {
                                message: utilities.ErrorMessages.USER_LOCKED_OUT
                            }
                        });
                    } else {
                        let claims;
                        try {
                            claims = await _fetchClaim(user._id);
                        } catch (ex) {
                            _logLogin(email, req, "FAILED_LOGIN");
                            return reject({
                                code: ex.code || 500,
                                error: ex.error
                            });
                        }
                        let claimsValue = claims.map(function (i) {
                            return i.ClaimType + ':' + i.ClaimValue;
                        }).join("|");

                        let accessToken = new AccessToken({
                            UserName: user.Email,
                            UserId: user._id,
                            AuthorisationScheme: user.AuthorisationScheme,
                            Owner: user.Owner,
                            iat: Math.floor(Date.now() / 1000) + config.token.ttl,
                            Claims: claimsValue
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
                        _logLogin(email, req, "SUCCESS");
                    }
                } else {
                    _logLogin(email, req, "FAILED_LOGIN");
                    return reject({
                        code: 401,
                        error: {
                            message: utilities.ErrorMessages.PASSWORD_INCORRECT
                        }
                    });
                }
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
                })
            }
            resolve(user);
        })
    });
};

const _logLogin = (email, req, status) => {
    let _userLogin = new UserLogin();
    _userLogin.UserName = email;
    _userLogin.UserIP = req.ip;
    _userLogin.Status = status;
    _userLogin.save();

};

const _fetchClaim = (userId) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            UserId: userId
        };
        UserClaim.find(query, (err, claims) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve(claims);
        });
    });
};

module.exports = {
    socialLogin,
    socialRegister,
    standardLogin,
    standardRegister
};