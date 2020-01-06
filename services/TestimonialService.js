const Testimonial = require.main.require('./models/Testimonial').model;
const FileService = require.main.require('./services/FileService');
/**
 * Creates a new Slider
 * @param {Object} slider - object of Slider model
 * @param {String} req  - ip address of the user fetched from req
 */

const getTestimonials = () => {
    return new Promise(async (resolve, reject) => {
        const query = {
            IsActive: true
        };
        Testimonial.find(query, (err, testimonials) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: testimonials
            });
        });
    });
};
const saveTestimonial = (testimonial, req) => {
    return new Promise(async (resolve, reject) => {
        if (!testimonial) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const newTestimonial = new Testimonial(testimonial);
        newTestimonial.AuditInfo = {
            CreatedByUser: req.user._id,
            CreationDate: new Date()
        };
        newTestimonial.save(err => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: newTestimonial
            });
        });
    });
};

const deleteTestimonial = (tid) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            _id: tid
        };
        if (!tid) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        Testimonial.findOneAndDelete(query).exec((err, data) => {
            if(err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            if(data){
                FileService.deleteBucketFile(data.ImageUrl);
                resolve({
                    code: 200,
                    data: 'Deleted'
                });
            }
        });
    });
};


module.exports = {
    getTestimonials,
    saveTestimonial,
    deleteTestimonial
};