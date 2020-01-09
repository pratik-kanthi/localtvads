const Subscriber = require.main.require('./models/Subscriber').model;

const getSubscribers = () => {
    return new Promise(async (resolve, reject) => {
        Subscriber.find({}).sort({ DateSubscribed: -1 }).exec((err, subscribers) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }

            resolve({
                code: 200,
                data: subscribers
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
                    error: err
                });
            }

            subscriber.IsActive = false;
            subscriber.save((err, sub) => {

                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }

                resolve({
                    code: 200,
                    data: sub
                });
            });
        });
    });
};

module.exports = {
    getSubscribers,
    unsubscribeUser
};