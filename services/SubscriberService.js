const Subscriber = require.main.require('./models/Subscriber').model;
const {
    removeSubscription
} = require.main.require('./services/MailChimpService');

const getSubscribers = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const subscribers = await Subscriber.find({}).sort({
                DateSubscribed: -1
            }).exec();
            resolve({
                code: 200,
                data: subscribers,
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const unsubscribeUser = (email) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!email) {
                return reject({
                    code: 500,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }

            const subscriber = await Subscriber.findOne({
                Email: email
            }).exec();

            if (subscriber) {
                subscriber.IsActive = false;
                try {
                    const result = await subscriber.save();
                    removeSubscription(email);
                    resolve({
                        code: 200,
                        data: result,
                    });
                } catch (err) {
                    logger.logError(`Failed to update subscriber ${email}`, err);
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
            } else {
                return reject({
                    code: 400,
                    error: {
                        message: 'Subscriber not found'
                    }
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

const fetchSubscribersByPage = (page, size, sortby) => {
    return new Promise(async (resolve, reject) => {
        try {
            page = parseInt(page) - 1;
            const result = await Subscriber.find({})
                .skip(page * size)
                .limit(size)
                .sort(sortby)
                .exec();
            resolve({
                code: 200,
                data: result
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

module.exports = {
    getSubscribers,
    unsubscribeUser,
    fetchSubscribersByPage,
};