const Subscriber = require.main.require('./models/Subscriber').model;

const getSubscribers = () => {
    return new Promise(async (resolve, reject) => {
        Subscriber.find({}, (err, subscribers) => {
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


module.exports = {
    getSubscribers
};