const Mailchimp = require('mailchimp-api-v3');
const mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);

const addToSubscribers = (email_address) => {
    return new Promise(async (resolve, reject) => {
        if (!email_address) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }
        const request_body = {
            members: [
                {
                    email_address: email_address,
                    email_type: 'html',
                    status: 'subscribed',
                },
            ],
        };
        mailchimp
            .post(`/lists/${process.env.MAILCHIMP_LIST_ID}`, request_body)
            .then((result) => {
                resolve({
                    code: 200,
                    data: result,
                });
            })
            .catch((err) => {
                return reject({
                    code: 500,
                    error: err,
                });
            });
    });
};

const removeSubscription = (email_address) => {
    return new Promise(async (resolve, reject) => {
        if (!email_address) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }
        const request_body = {
            members: [
                {
                    email_address: email_address,
                    email_type: 'html',
                    status: 'unsubscribed',
                },
            ],
        };
        mailchimp
            .post(`/lists/${process.env.MAILCHIMP_LIST_ID}`, request_body)
            .then((result) => {
                resolve({
                    code: 200,
                    data: result,
                });
            })
            .catch((err) => {
                return reject({
                    code: 500,
                    error: err,
                });
            });
    });
};

module.exports = {
    addToSubscribers,
    removeSubscription,
};
