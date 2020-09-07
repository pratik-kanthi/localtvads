const jimp = require('jimp');
const Client = require.main.require('./models/Client').model;
const Testimonial = require.main.require('./models/Testimonial').model;
const Staff = require.main.require('./models/Staff').model;

const {
    deleteBucketFile,
    uploadFileBuffer
} = require.main.require('./services/FileService');

const model = {
    Client: Client,
    Testimonial: Testimonial,
    Staff: Staff,
};

/**
 * crop image
 * @param {Object} query - query params of the request - cropx, cropy, cropw, croph
 * @param {Binary} file - file to be cropped
 */
const cropImage = (query, file) => {
    return new Promise(async (resolve, reject) => {
        try {
            jimp.read(file.buffer, (err, image) => {
                if (err) {
                    logger.logError('Failed to read image from buffer', err);
                    return reject(err);
                }
                try {
                    image.crop(parseInt(query.cropx), parseInt(query.cropy), parseInt(query.cropw), parseInt(query.croph), (err, cImage) => {
                        try {
                            cImage.getBuffer(file.mimetype, async (err, buffer) => {
                                if (err) {
                                    logger.logError('Failed to read image from buffer', err);
                                    return reject(err);
                                }
                                file.buffer = buffer;
                                resolve(file);
                            });
                        } catch (err) {
                            logger.logError('Failed to read image from buffer', err);
                            return reject(err);
                        }
                    });
                } catch (err) {
                    logger.logError('Failed to crop image', err);
                    return reject(err);
                }
            });
        } catch (err) {
            logger.logError('Failed to crop image', err);
            return reject(err);
        }

    });
};

/**
 * resize image to a particular size
 * @param {Object} source - source url of file
 * @param {Number} width - width of the image
 * @param {Number} height - height of the image
 * @param {Number} quality - quality
 */
const resizeImage = (source, width, height, quality) => {
    return new Promise(async (resolve, reject) => {
        let pic;
        try {
            pic = await jimp.read(source);
        } catch (ex) {
            logger.logError('Failed to read image by jimp'.ex);
            return reject({
                code: 500,
                error: ex,
            });
        }
        try {
            await pic.resize(width, height).quality(quality).write(source);
            resolve();
        } catch (ex) {
            logger.logError('Failed to resize image', ex);
            return reject({
                code: 500,
                error: ex,
            });
        }
    });
};

/**
 * Delete image from the bucket
 * @param {String} location - location of the image from where image needs to be removed
 */
const removeBucketImage = (location) => {
    return new Promise(async (resolve, reject) => {
        try {
            await deleteBucketFile(location);
            resolve({
                code: 200,
                data: {
                    msg: 'Deleted',
                },
            });
        } catch (err) {
            logger.logError('Failed to remove bucket image', err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

/**
 * Delete image from the bucket
 * @param {String} attribute - Property of the model which contains url of the image
 * @param {String} owner - Owner of the image
 * @param {String} ownerid - _id of the Owner
 */
const removeImage = (attribute, owner, ownerid) => {
    return new Promise((resolve, reject) => {
        try {
            const Owner = model[owner];
            if (!Owner) {
                return reject({
                    code: 500,
                    error: {
                        err: 'Invalid Owner Type',
                    },
                });
            }
            Owner.findOne({
                _id: ownerid
            }, (err, data) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                if (data) {
                    deleteBucketFile(data[attribute]);
                    data[attribute] = null;
                    data.save((err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err,
                            });
                        } else {
                            return resolve({
                                code: 200,
                                data: data,
                            });
                        }
                    });
                } else {
                    return reject({
                        code: 404,
                        error: {
                            err: 'Owner not found',
                        },
                    });
                }
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }

    });
};

/**
 * Delete image from the bucket
 * @param {Binary} file - Binary image file
 * @param {Object} query - query params of the request
 */
const uploadImage = (file, query) => {
    return new Promise((resolve, reject) => {
        try {
            const time = Date.now();
            const extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
            const Owner = model[query.owner];

            if (!Owner) {
                return reject({
                    code: 500,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const dst = 'uploads/' + Owner.modelName + '/' + query.ownerid + '/Profile/' + time + extension;

            let deleteFilelocation = null;

            Owner.findOne({
                _id: query.ownerid,
            },
            async (err, data) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                } else if (!data) {
                    return reject({
                        code: 404,
                        error: {
                            message: Owner + utilities.ErrorMessages.NOT_FOUND,
                        },
                    });
                } else {
                    if (data[query.attribute] && data[query.attribute].trim() !== '') {
                        deleteFilelocation = data[query.attribute];
                    }
                    data[query.attribute] = dst;

                    if (query.cropx) {
                        try {
                            file = await cropImage(query, file);
                        } catch (ex) {
                            return reject({
                                code: 500,
                                error: ex,
                            });
                        }
                    }

                    try {
                        await _uploadFileToBucket(file, dst, deleteFilelocation, query.owner, data);
                        resolve({
                            code: 200,
                            data: data,
                        });
                    } catch (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                }
            }
            );
        } catch (err) {
            logger.logError('Failed to upload image', err);
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const _uploadFileToBucket = (file, dst, deleteFileLocation, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            await uploadFileBuffer(file, dst, deleteFileLocation);
            data.save((err) => {
                if (err) {
                    logger.logError('Failed to save to collection', err);
                    return reject(err);
                } else {
                    resolve(data);
                }
            });
        } catch (err) {
            logger.logError(`Failed to upload image to ${dst}`, err);
            return reject(err);
        }
    });
};

module.exports = {
    _uploadFileToBucket,
    uploadImage,
    removeImage,
    removeBucketImage,
    cropImage,
    resizeImage,
};