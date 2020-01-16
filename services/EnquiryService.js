const Enquiry = require.main.require('./models/Enquiry').model;

const fetchEnquiries = () => {
    return new Promise(async (resolve, reject) => {
        Enquiry.find({}).sort({
            Date: -1
        }).exec((err, enquiries) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }

            resolve({
                code: 200,
                data: enquiries
            });
        });
    });
};

const fetchEnquiry = (eid) => {
    return new Promise(async (resolve, reject) => {
        if (!eid) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        Enquiry.findOne({
            _id: eid
        }, (err, enquiry) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }

            resolve({
                code: 200,
                data: enquiry
            });
        });
    });
};

const deleteEnquiry = (eid) => {
    return new Promise(async (resolve, reject) => {
        if (!eid) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        Enquiry.deleteOne({
            _id: eid
        }, (err, enquiry) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }

            resolve({
                code: 200,
                data: enquiry
            });
        });
    });
};

module.exports = {
    fetchEnquiries,
    fetchEnquiry,
    deleteEnquiry
};