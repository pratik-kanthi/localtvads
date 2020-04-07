const Slider = require.main.require('./models/Slider').model;
const FileService = require.main.require('./services/FileService');

/**
 * Creates a new Slider
 * @param {Object} slider - object of Slider model
 * @param {String} req  - ip address of the user fetched from req
 */

const getSliders = () => {
    return new Promise(async (resolve, reject) => {
        const query = {
            IsActive: true
        };
        Slider.find(query).sort({
            Order: 1
        }).exec((err, sliders) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: sliders
            });
        });
    });
};

const saveSlider = (slider, file, req) => {
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
        const time = Date.now();
        const extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
        const dst = 'uploads/Sliders/' + time + extension;
        try {
            await FileService.uploadImage(file, dst);
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
        newSlider.ImageUrl = dst;
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

const updateSlider = (slider, file, req) => {
    return new Promise(async (resolve, reject) => {
        if (!slider) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            _id: slider._id
        };
        Slider.findOne(query, (err, sliderData) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!slider) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Slider' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                sliderData.AuditInfo.EditedByUser = req.user._id;
                sliderData.AuditInfo.EditDate = new Date();
                sliderData.Name = slider.Name;
                sliderData.Description = slider.Description;
                sliderData.IsActive = slider.IsActive;
                if (file) {
                    const time = Date.now();
                    const extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
                    const dst = 'uploads/Sliders/' + time + extension;
                    sliderData.ImageUrl = dst;
                    FileService.uploadImage(file, dst, slider.ImageUrl);
                } else {
                    sliderData.ImageUrl = slider.ImageUrl;
                }
                sliderData.save(err => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    resolve({
                        code: 200,
                        data: sliderData
                    });
                });
            }
        });
    });
};

const deleteSlider = (sliderId) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            _id: sliderId
        };
        if (!sliderId) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        Slider.findOneAndDelete(query).exec((err, data) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            if (data) {
                FileService.deleteBucketFile(data.ImageUrl);
                resolve({
                    code: 200,
                    data: 'Deleted'
                });
            }
        });
    });
};

const updateOrders = (slidersData, req) => {
    return new Promise(async (resolve, reject) => {
        if (!slidersData) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const queue = slidersData.map(item => _updateOrder(item, req));
        try {
            const result = await Promise.all(queue);
            resolve({
                code: 200,
                data: result
            });
        } catch (err) {
            return reject({
                code: err.code,
                error: err.error
            });
        }
    });
};

const _updateOrder = (slider, req) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            _id: slider._id
        };
        Slider.findOneAndUpdate(query, slider).exec((err, data) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            data.AuditInfo.EditedByUser = req.user._id;
            data.AuditInfo.EditDate = new Date();
            resolve(data);
        });
    });
};

module.exports = {
    getSliders,
    saveSlider,
    updateSlider,
    deleteSlider,
    updateOrders
};