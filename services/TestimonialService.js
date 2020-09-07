const Testimonial = require.main.require('./models/Testimonial').model;
const FileService = require.main.require('./services/FileService');

const getTestimonials = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = {
                IsActive: true,
            };
            const testimonials = await Testimonial.find(query).exec();
            resolve({
                code: 200,
                data: testimonials,
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const saveTestimonial = (testimonial, req) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!testimonial) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const newTestimonial = new Testimonial(testimonial);
            newTestimonial.AuditInfo = {
                CreatedByUser: req.user._id,
                CreationDate: new Date(),
            };

            try {
                const result = await newTestimonial.save();
                resolve({
                    code: 200,
                    data: result,
                });
            } catch (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            }

        } catch (err) {
            logger.logError('Failed to save testimonial', err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const deleteTestimonial = (tid) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!tid) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                _id: tid,
            };

            try {
                const result = await Testimonial.findOneAndDelete(query).exec();
                if (result) {
                    FileService.deleteBucketFile(result.ImageUrl);
                }
                resolve({
                    code: 200,
                    data: 'Deleted',
                });
            } catch (err) {
                logger.logError('Failed to delete testimonial from database', err);
                return reject({
                    code: 500,
                    error: err,
                });
            }

        } catch (err) {
            logger.logError('Failed to delete testimonial', err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

module.exports = {
    getTestimonials,
    saveTestimonial,
    deleteTestimonial,
};