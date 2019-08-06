const jimp = require('jimp');

const Client = require.main.require('./models/Client').model;
const filesService = require.main.require('./FileService');

const model = {
    Client: Client
};

const removeBucketImage = (location) => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await filesService.deleteBucketFile(location);
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

const uploadImage = (file, query) => {
    return new Promise((resolve, reject) => {

        //for file name
        let time = Date.now();

        //identify the extension of the file
        let extension = file.originalname.substr(file.originalname.lastIndexOf('.'));

        // get the model for the owner
        let Owner = model[query.owner];

        if (!Owner) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            })
        }
        //get the destination folder
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
            if (data) {
                if (data[query.attribute] && data[query.attribute].trim() !== "")
                    deleteFilelocation = data[query.attribute];

                data[query.attribute] = dst;

                // check if image has to be cropped
                if (query.cropx) {
                    try {
                        jimp.read(file.buffer, (err, image) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err
                                })
                            }
                            try {
                                image.crop(parseInt(query.cropx), parseInt(query.cropy), parseInt(query.cropx2) - parseInt(query.cropx), parseInt(query.cropy2) - parseInt(query.cropy), (err, cImage) => {
                                    try {
                                        cImage.getBuffer(file.mimetype, async (err, buffer) => {
                                            if (err)
                                                return reject({
                                                    code: 500,
                                                    error: err
                                                });
                                            file.buffer = buffer;

                                            try {
                                                let result = await uploadFileToBucket(file, dst, deleteFilelocation, query.owner, data);
                                                resolve({
                                                    code: 200,
                                                    data: result
                                                })
                                            } catch (err) {
                                                return reject({
                                                    code: 500,
                                                    error: err
                                                })
                                            }
                                        });
                                    } catch (err) {
                                        return reject({
                                            code: 500,
                                            error: err
                                        });
                                    }
                                })
                            } catch (err) {
                                return reject({
                                    code: 500,
                                    error: err
                                });
                            }
                        })
                    } catch (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                } else {
                    try {
                        let result = await uploadFileToBucket(file, dst, deleteFilelocation, query.owner, data);
                        resolve({
                            code: 200,
                            data: data
                        })
                    } catch (err) {
                        return reject({
                            code: 500,
                            error: err
                        })
                    }
                }
            } else
                return reject({
                    code: 404,
                    error: {
                        message: Owner + utilities.ErrorMessages.NOT_FOUND
                    }
                });
        });
    });
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
                filesService.deleteBucketFile(data[attribute]);
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

const uploadFileToBucket = (file, dst, deleteFilelocation, owner, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await filesService.uploadImage(file, dst, deleteFilelocation);
            data.save((err) => {
                if (err)
                    return reject(err);
                else
                    resolve(data);
            })
        } catch (err) {
            return reject(err);
        }
    });
};

module.exports = {
    uploadImage,
    removeImage,
    removeBucketImage
};