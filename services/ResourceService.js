const fs = require('fs-extra');

const config = require.main.require('./config');

const Client = require.main.require('./models/Client').model;
const ClientResource = require.main.require('./models/ClientResource').model;

const {uploadFileBuffer, deleteBucketFile} = require.main.require('./services/FileService');
const {cropImage} = require.main.require('./services/ImageService');

/**
 * Add an Image
 * @param {Object} image - Object containing Image's details
 * @param {Object} file - File object in the form of multipart
 */
const addImageResource = (image, file) => {
    return new Promise(async (resolve, reject) => {
        if (!file || !image) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        image = JSON.parse(image);

        let query = {
            _id: image.ownerid
        };
        Client.findOne(query, {_id: 1}, async (err, client) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!client) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                if (image.cropx) {
                    try {
                        file = await cropImage(image, file);
                    } catch (ex) {
                        return reject({
                            code: 500,
                            error: ex
                        });
                    }
                }
                let time = Date.now();
                let extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
                let dst = 'uploads/Client/' + client._id.toString() + '/Resources/Images/' + time + extension;
                try {
                    let result = await uploadFileBuffer(file, dst);
                } catch (ex) {
                    return reject({
                        code: 500,
                        error: ex
                    });
                }
                let clientResource = new ClientResource({
                    Name: image.name,
                    Client: client._id,
                    Type: 'IMAGE',
                    ResourceUrl: dst
                });
                clientResource.save(err => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    resolve({
                        code: 200,
                        data: client
                    });
                });
            }
        });
    });
};

/**
 * Update an Image
 * @param {Object} image - Object containing Image's details
 * @param {Object} file (optional) - File object in the form of multipart
 */
const updateImageResource = (image, file) => {
    return new Promise(async (resolve, reject) => {
        if (!image || !image.ownerid || !image._id) {
            return reject({
                code: 500,
                error: utilities.ErrorMessages.BAD_REQUEST
            });
        }
        let query = {
            _id: image._id
        };
        ClientResource.findOne(query, async (err, clientResource) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!clientResource) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Resource' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                if (file) {
                    if (image.cropx) {
                        try {
                            file = await cropImage(image, file);
                        } catch (ex) {
                            return reject({
                                code: 500,
                                error: ex
                            });
                        }
                    }
                    let time = Date.now();
                    let extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
                    let dst = 'uploads/Client/' + image.Client.toString() + '/Resources/Images/' + time + extension;
                    try {
                        let result = await uploadFileBuffer(file, dst, clientResource.ResourceUrl);
                        clientResource.ResourceUrl = dst;
                    } catch (ex) {
                        return reject({
                            code: 500,
                            error: ex
                        });
                    }
                }
                clientResource.Name = image.Name;
                clientResource.save(err => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    if (file) {
                        try {
                            fs.removeSync(file.path);
                        } catch (ex) {
                            return reject({
                                code: 500,
                                error: ex
                            });
                        }
                    }
                    resolve({
                        code: 200,
                        data: clientResource
                    });
                });
            }
        });
    });
};

/**
 * Delete an Image
 * @param {String} image - _id of the resource document to be deleted
 */
const deleteImageResource = (image) => {
    return new Promise(async (resolve, reject) => {
        if (!image._id) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let query = {
            _id: image._id
        };
        ClientResource.findOneAndRemove(query, async (err, clientResource) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!clientResource) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {

                try {
                    let result = await deleteBucketFile(clientResource.ResourceUrl);
                } catch (ex) {
                    return reject({
                        code: 500,
                        error: ex
                    });
                }
            }
        });
    });
};

/**
 * Add a media
 * @param {Object} media - Object containing media's details
 * @param {Object} file - File object in the form of multipart
 */
const addMediaResource = (media, file) => {
    return new Promise(async (resolve, reject) => {
        if (!file || !media) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        media = JSON.parse(media);
        let query = {
            _id: media.ownerid
        };
        Client.findOne(query, {_id: 1}, async (err, client) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!client) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                let time = Date.now();
                let extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
                if (file.fileType) {
                    return reject({
                        code: 400,
                        error: {
                            message: utilities.ErrorMessages.UNSUPPORTED_MEDIA_TYPE
                        }
                    })
                }
                let dst = 'uploads/Client/' + client._id.toString() + '/Resources/Media/' + time + extension;
                try {
                    let result = await uploadFileBuffer(file, dst);
                    let clientResource = new ClientResource({
                        Name: media.name,
                        Client: client._id,
                        Type: file.fileType,
                        ResourceUrl: dst
                    });
                    clientResource.save(err => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }
                        if (file && file.path) {
                            try {
                                fs.removeSync(file.path);
                            } catch (ex) {
                                return reject({
                                    code: 500,
                                    error: ex
                                });
                            }
                        }
                        resolve({
                            code: 200,
                            data: client
                        });
                    });
                } catch (ex) {
                    return reject({
                        code: 500,
                        error: ex
                    });
                }
            }
        });
    });
};

/**
 * Update a media
 * @param {Object} media - Object containing media's details
 * @param {Object} file (optional) - File object in the form of multipart
 */
const updateMediaResource = (media, file) => {
    return new Promise(async (resolve, reject) => {
        if (!media) {
            return reject({
                code: 500,
                error: utilities.ErrorMessages.BAD_REQUEST
            });
        }
        media = JSON.parse(media);
        let query = {
            _id: media._id
        };
        ClientResource.findOne(query, async (err, clientResource) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!clientResource) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Resource' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                if (file) {
                    let time = Date.now();
                    let extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
                    if (!file.fileType) {
                        return reject({
                            code: 400,
                            error: {
                                message: utilities.ErrorMessages.UNSUPPORTED_MEDIA_TYPE
                            }
                        });
                    }
                    let dst = 'uploads/Client/' + media.ownerid.toString() + '/Resources/Media/' + time + extension;
                    try {
                        let result = await uploadFileBuffer(file, dst, clientResource.ResourceUrl);
                        clientResource.ResourceUrl = dst;
                    } catch (ex) {
                        return reject({
                            code: 500,
                            error: ex
                        });
                    }
                }
                clientResource.Name = media.name || clientResource.Name;
                clientResource.save(err => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    if (file && file.path) {
                        try {
                            fs.removeSync(file.path);
                        } catch (ex) {
                            return reject({
                                code: 500,
                                error: ex
                            });
                        }
                    }
                    resolve({
                        code: 200,
                        data: clientResource
                    });
                });
            }
        });
    });
};

/**
 * Delete an Image
 * @param {String} id - _id of the resource document to be deleted
 */
const deleteMediaResource = (id) => {
    return new Promise(async (resolve, reject) => {
        if (!id) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let query = {
            _id: id
        };
        ClientResource.findOneAndRemove(query, async (err, clientResource) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!clientResource) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                try {
                    let result = await deleteBucketFile(clientResource.ResourceUrl);
                    resolve({
                        code: 200,
                        data: 'Deleted'
                    })
                } catch (ex) {
                    return reject({
                        code: 500,
                        error: ex
                    });
                }
            }
        });
    });
};

/**
 * Get all media
 * @param {String} id - _id of the client
 */
const getAllMediaResources = (id) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            Client: id
        };

        ClientResource.find(query, (err, clientResources) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: clientResources
            });
        });
    });
};

module.exports = {
    addImageResource,
    updateImageResource,
    deleteImageResource,
    addMediaResource,
    updateMediaResource,
    deleteMediaResource,
    getAllMediaResources
};