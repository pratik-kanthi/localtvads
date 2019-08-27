const jimp = require('jimp');

const Client = require.main.require('./models/Client').model;

const {deleteBucketFile, uploadFileBuffer} = require.main.require('./services/FileService');

const model = {
    Client: Client
};

const cropImage = (query, file) => {
    return new Promise(async (resolve, reject) => {
        jimp.read(file.buffer, (err, image) => {
            if (err) {
                return reject(err);
            }
            try {
                image.crop(parseInt(query.cropx), parseInt(query.cropy), parseInt(query.cropw), parseInt(query.croph), (err, cImage) => {
                    try {
                        cImage.getBuffer(file.mimetype, async (err, buffer) => {
                            if (err) {
                                return reject(err);
                            }
                            file.buffer = buffer;
                            resolve(file);
                        });
                    } catch (err) {
                        return reject(err);
                    }
                })
            } catch (err) {
                return reject(err);
            }
        });
    });
};

const resizeImage = (source, width, height, quality) => {
    return new Promise(async (resolve, reject) => {
        let pic;
        try {
            pic = await jimp.read(source);
        } catch (ex) {
            logger.logError(ex);
            return reject({
                code: 500,
                error: ex
            });
        }
        try {
            let result = await pic.resize(width, height).quality(quality).write(source);
            resolve();
        } catch (ex) {
            logger.logError(ex);
            return reject({
                code: 500,
                error: ex
            });
        }
    });
};

const removeBucketImage = (location) => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await deleteBucketFile(location);
            resolve({
                code: 200,
                data: {
                    msg: 'Deleted'
                }
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err
            })
        }
    })
};

const removeImage = (attribute, owner, ownerid) => {
    return new Promise((resolve, reject) => {
        let Owner = model[owner];

        if (!Owner) {
            return reject({
                code: 500,
                error: {
                    err: 'Invalid Owner Type'
                }
            });
        }

        Owner.findOne({_id: ownerid}, (err, data) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                })
            }
            if (data) {
                deleteBucketFile(data[attribute]);
                data[attribute] = null;
                data.save((err) => {
                    if (err)
                        return reject({
                            code: 500,
                            error: err
                        });
                    else {
                        return resolve({
                            code: 200,
                            data: data
                        })
                    }
                })
            } else
                return reject({
                    code: 404,
                    error: {
                        err: 'Owner not found'
                    }
                });
        });
    })
};

const uploadImage = (file, query) => {
    return new Promise((resolve, reject) => {

        let time = Date.now();

        let extension = file.originalname.substr(file.originalname.lastIndexOf('.'));

        let Owner = model[query.owner];

        if (!Owner) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            })
        }
        let dst = 'uploads/' + Owner.modelName + '/' + query.ownerid + '/Profile/' + time + extension;

        let deleteFilelocation = null;

        Owner.findOne({
            _id: query.ownerid
        }, async (err, data) => {
            if (err)
                return reject({
                    code: 500,
                    error: err
                });
            else if (!data) {
                return reject({
                    code: 404,
                    error: {
                        message: Owner + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                if (data[query.attribute] && data[query.attribute].trim() !== "")
                    deleteFilelocation = data[query.attribute];
                data[query.attribute] = dst;

                if (query.cropx) {
                    try {
                        file = await cropImage(query, file);
                    } catch (ex) {
                        return reject({
                            code: 500,
                            error: ex
                        });
                    }
                }

                try {
                    let result = await _uploadFileToBucket(file, dst, deleteFilelocation, query.owner, data);
                    resolve({
                        code: 200,
                        data: data
                    });
                } catch (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
            }
        });
    });
};

const _uploadFileToBucket = (file, dst, deleteFileLocation, owner, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await uploadFileBuffer(file, dst, deleteFileLocation);
            data.save((err) => {
                if (err)
                    return reject(err);
                else
                    resolve(data);
            });
        } catch (err) {
            return reject(err);
        }
    });
};

module.exports = {
    uploadImage,
    removeImage,
    removeBucketImage,
    cropImage,
    resizeImage
};

