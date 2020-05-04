const FAQ = require.main.require('./models/FAQ').model;

const addFAQ = (newfaq, user) => {
    return new Promise(async (resolve, reject) => {
        if (!newfaq || !user) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }

        const faq = new FAQ(newfaq);
        faq.save((err, saved) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            }

            resolve({
                code: 200,
                dat: saved,
            });
        });
    });
};

module.exports = {
    addFAQ,
};
