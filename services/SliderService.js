const Slider = require.main.require('./models/Slider').model;

/**
 * Creates a new Slider
 * @param {Object} slider - object of Slider model
 * @param {String} req  - ip address of the user fetched from req
 */
const saveSlider = (slider, req) => {
    return new Promise(async (resolve, reject) => {
        if (!slider) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const newSlider = new Slider(slider);
        newSlider.AuditInfo = {
            CreatedByUser: req.user._id,
            CreationDate: new Date()
        };
        newSlider.save(err => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: newSlider
            });
        });
    });
};


module.exports = {
    saveSlider
};