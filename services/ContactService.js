const Subscriber = require.main.require('./models/Subscriber').model;
const Enquiry = require.main.require('./models/Enquiry').model;
const Email = require.main.require('./email');
const {
    addToSubscribers
} = require.main.require('./services/MailChimpService');

const subscribeUser = (email, ip) => {
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
                Email: email,
            };
            let subscriber = await Subscriber.findOne(query).exec();
            if (subscriber) {
                logger.logInfo(`Email ${email} already subscribed`);
                return reject({
                    code: 409,
                    error: {
                        message: utilities.ErrorMessages.ALREADY_SUBSCRIBED,
                    },
                });
            } else {
                subscriber = new Subscriber({
                    DateSubscribed: new Date(),
                    Email: email,
                    IsActive: true,
                    IpAddress: ip,
                });
                try {
                    await addToSubscribers(email);
                } catch (err) {
                    logger.logWarning(`Failed to add ${email} to mailchimp list`, err);
                }
                await subscriber.save();
                resolve({
                    code: 200,
                    data: subscriber,
                });
            }
        } catch (err) {
            logger.logError(`Failed to add ${email} to subscriber list`, err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const submitEnquiry = (name, email, subject, message) => {
    return new Promise(async (resolve, reject) => {

        try {
            if (!name || !email || !subject || !message) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const enquiry = new Enquiry({
                Date: new Date(),
                Email: email,
                Name: name,
                Subject: subject,
                Message: message,
            });

            await enquiry.save();

            try {
                Email.helper.enquiryAdminEmail(enquiry);
                resolve({
                    code: 200,
                    data: enquiry,
                });
            } catch (err) {
                logger.logWarning('Failed to send enquiry notification to admin', err);
                resolve({
                    code: 200,
                    data: enquiry,
                });
            }
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

module.exports = {
    subscribeUser,
    submitEnquiry,
};