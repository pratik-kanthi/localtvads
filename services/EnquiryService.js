const Enquiry = require.main.require('./models/Enquiry').model;

const fetchEnquiries = (page, size, sortby) => {
    return new Promise(async (resolve, reject) => {
        try {
            page = parseInt(page) - 1;
            const enquiries = await Enquiry.find()
                .skip(page * size)
                .limit(size)
                .sort(sortby)
                .exec();

            resolve({
                code: 200,
                data: enquiries
            });

        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const fetchEnquiry = (enquiry_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!enquiry_id) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const query = {
                _id: enquiry_id
            };
            const result = await Enquiry.findOne(query);
            resolve({
                code: 200,
                data: result
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
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

const fetchEnquiryByPage = (page, size, sortby) => {
    return new Promise(async (resolve, reject) => {
        page = page - 1;

        Enquiry.find({}).skip(page * size).limit(size).sort(sortby).exec((err, enquiry) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                resolve({
                    code: 200,
                    data: enquiry
                });
            }
        });
    });
};

module.exports = {
    fetchEnquiries,
    fetchEnquiry,
    deleteEnquiry,
    fetchEnquiryByPage
};