const Subscriber = require.main.require('./models/Subscriber').model;
const { removeSubscription } = require.main.require('./services/MailChimpService');

const getSubscribers = () => {
    return new Promise(async (resolve, reject) => {
        Subscriber.find({})
            .sort({ DateSubscribed: -1 })
            .exec((err, subscribers) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }

                resolve({
                    code: 200,
                    data: subscribers,
                });
            });
    });
};

const unsubscribeUser = (email) => {
    return new Promise(async (resolve, reject) => {
        Subscriber.findOne({ Email: email }, (err, subscriber) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            }

            subscriber.IsActive = false;
            subscriber.save(async (err, sub) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }

                await removeSubscription(email);
                resolve({
                    code: 200,
                    data: sub,
                });
            });
        });
    });
};

const fetchSubscribersByPage = (page, size, sortby) => {
    return new Promise(async (resolve, reject) => {
        page = page - 1;
        Subscriber.find({})
            .skip(page * size)
            .limit(size)
            .sort(sortby)
            .exec((err, subscribers) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                } else {
                    resolve({
                        code: 200,
                        data: subscribers,
                    });
                }
            });
    });
};

module.exports = {
    getSubscribers,
    unsubscribeUser,
    fetchSubscribersByPage,
};
