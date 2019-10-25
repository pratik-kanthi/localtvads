const Client = require.main.require('./models/Client').model;
const User = require.main.require('./models/User').model;
const Email = require('../email');

const updateProfile = (userid, title, email, phone, currentpassword, newpassword) => {
    return new Promise(async (resolve, reject) => {
        let emailchanged = false;
        if (!userid) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        const query = {
            _id: userid
        };

        User.findOne(query, async (err, user) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!user) {
                return reject({
                    code: 404,
                    error: {
                        message: 'User ' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {

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
                Client.findOne({_id: user.Owner._id}, (err, client) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    } else if (!client) {
                        return reject({
                            code: 404,
                            error: {
                                message: 'User ' + utilities.ErrorMessages.NOT_FOUND
                            }
                        });
                    } else {
                        client.Name = title;
                        client.Email = email;
                        client.Phone = phone;
                        client.save(err, () => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err
                                });
                            }
                            user.save((err) => {
                                if (err) {
                                    return reject({
                                        code: 500,
                                        error: err.code === 11000 ? { message: 'Provided email already exists ' } : err
                                    });
                                } else {
                                    if (emailchanged) {
                                        const verification_link = process.env.APP + 'api/auth/confirmation/' + user.id;
                                        Email.helper.emailChangeVerification(user.Email, verification_link);

                                        resolve({
                                            code: 205,
                                            data: user
                                        });

                                    } else {

                                        resolve({
                                            code: 200,
                                            data: client
                                        });
                                    }
                                }
                            });
                        });
                    }
                });
            }
        });
    });
};

module.exports = {
    updateProfile
};
