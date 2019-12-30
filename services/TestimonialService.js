const Testimonial = require.main.require('./models/Testimonial').model;

/**
 * Creates a new Slider
 * @param {Object} slider - object of Slider model
 * @param {String} req  - ip address of the user fetched from req
 */
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


module.exports = {
    saveTestimonial
};