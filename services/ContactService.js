const Subscriber = require.main.require('./models/Subscriber').model;
const Enquiry = require.main.require('./models/Enquiry').model;
const Email = require.main.require('./email');

/**
 * Creates a new subscriber
 * @param {String} email - email address of the user 
 * @param {String} ip  - ip address of the user fetched from req.ip
 */
const subscribeUser = (email, ip) => {
    return new Promise(async (resolve, reject) => {
        if (!email) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else {
            const query = {
                Email: email
            };
            Subscriber.findOne(query, (err, subscriber) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                } else if (subscriber) {
                    return reject({
                        code: 409,
                        error: {
                            message: utilities.ErrorMessages.ALREADY_SUBSCRIBED
                        }
                    });
                } else {

                    const subscriber = new Subscriber({
                        DateSubscribed: new Date(),
                        Email: email,
                        IsActive: true,
                        IpAddress: ip
                    });
                    subscriber.save((err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }
                        resolve({
                            code: 200,
                            data: subscriber
                        });
                    });
                }
            });
        }
    });
};

/**
 * Creates a new enquiry
 * @param {String} name 
 * @param {String} email 
 * @param {String} subject 
 * @param {String} message 
 */
const submitEnquiry = (name, email, subject, message) => {
    return new Promise(async (resolve, reject) => {

        if (!name || !email || !subject || !message) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else {
            const enquiry = new Enquiry({
                Date: new Date(),
                Email: email,
                Name: name,
                Subject: subject,
                Message: message
            });

            enquiry.save((err) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });

                }
                Email.helper.enquiryAdminEmail(enquiry);
                resolve({
                    code: 200,
                    data: enquiry
                });
            });
        }
    });
};

module.exports = {
    subscribeUser,
    submitEnquiry
};