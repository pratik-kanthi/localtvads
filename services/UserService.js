const Client = require.main.require('./models/Client').model;
const User = require.main.require('./models/User').model;
const Email = require('../email');

const updateProfile = (userid, title, email, phone, currentpassword, newpassword) => {
    return new Promise(async (resolve, reject) => {
        try {
            let emailchanged = false;
            if (!userid) {
                return reject({
                    code: 500,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            let query = {
                _id: userid
            };
            const user = await User.findOne(query).exec();
            user.Name = title;
            user.Phone = phone;
            user.Owner.Title = title;
            user.Owner.Phone = phone;

            if (user.Email !== email) {
                //email was changed
                user.UserName = email;
                user.Email = email;
                user.Owner.Email = email;
                user.IsEmailConfirmed = false;
                emailchanged = true;

            }

            if (currentpassword && newpassword) {

                if (user.ValidatePassword(currentpassword, user.PasswordHash)) {
                    user.PasswordHash = user.EncryptPassword(newpassword);
                } else {
                    return reject({
                        code: 401,
                        error: {
                            message: utilities.ErrorMessages.PASSWORD_INCORRECT
                        }
                    });
                }
            }

            try {

                query = {
                    _id: user.Owner._id
                };

                const client = await Client.findOne(query).exec();
                client.Name = title;
                client.Email = email;
                client.Phone = phone;

                await client.save();
                await user.save();

                if (emailchanged) {
                    try {
                        const verification_link = process.env.APP + 'api/auth/confirmation/' + user.id;
                        Email.helper.emailChangeVerification(user.Email, verification_link);
                        resolve({
                            code: 205,
                            data: user
                        });
                    } catch (err) {
                        logger.logError('Failed to send verification email', err);
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                } else {
                    resolve({
                        code: 200,
                        data: client
                    });
                }
            } catch (err) {
                return reject({
                    code: 500,
                    error: err
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

const updatePassword = (userid, currentpassword, newpassword) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!currentpassword || !newpassword) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const user = await User.findOne({
                _id: userid
            }).exec();

            if (user.ValidatePassword(currentpassword, user.PasswordHash)) {
                user.PasswordHash = user.EncryptPassword(newpassword);
            } else {
                logger.logDebug('Password validation failed for user', user);
                return reject({
                    code: 401,
                    error: {
                        message: utilities.ErrorMessages.PASSWORD_INCORRECT
                    }
                });
            }

            try {
                const result = await user.save();
                resolve({
                    code: 200,
                    data: result
                });

            } catch (err) {
                return reject({
                    code: 500,
                    error: err
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

module.exports = {
    updateProfile,
    updatePassword
};