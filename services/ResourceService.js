const fs = require('fs-extra');
const mongoose = require('mongoose');
const Client = require.main.require('./models/Client').model;
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ClientResource = require.main.require('./models/ClientResource').model;

const {
    uploadFileBuffer,
    deleteBucketFile
} = require.main.require('./services/FileService');
const {
    cropImage
} = require.main.require('./services/ImageService');


const saveClientVideo = (client, path, extension, socket) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!client || !path) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }
            const resource = new ClientResource({
                Client: client,
                ResourceType: 'VIDEO',
                ResourceUrl: path
            });

            resource.AuditInfo = {};
            resource.AuditInfo.EditedByUser = mongoose.Types.ObjectId(client);
            resource.AuditInfo.EditDate = new Date();

            resource.save((err) => {
                if (err) {
                    socket.emit('PROCESS_ERRROR');
                }
                socket.emit('PROCESS_FINISHED', resource);
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
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }

        image = JSON.parse(image);

        const query = {
            _id: image.ownerid,
        };
        Client.findOne(query, {
            _id: 1
        }, async (err, client) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            } else if (!client) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client' + utilities.ErrorMessages.NOT_FOUND,
                    },
                });
            } else {
                if (image.cropx) {
                    try {
                        file = await cropImage(image, file);
                    } catch (ex) {
                        return reject({
                            code: 500,
                            error: ex,
                        });
                    }
                }
                const time = Date.now();
                const extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
                const dst = 'uploads/Client/' + client._id.toString() + '/Resources/Images/' + time + extension;
                try {
                    await uploadFileBuffer(file, dst);
                } catch (ex) {
                    return reject({
                        code: 500,
                        error: ex,
                    });
                }
                const clientResource = new ClientResource({
                    Name: image.name.replace(extension, ''),
                    Client: client._id,
                    ResourceType: 'IMAGE',
                    ResourceUrl: dst,
                });
                clientResource.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    resolve({
                        code: 200,
                        data: clientResource,
                    });
                });
            }
        });
    });
};



const addDocumentResource = (document, file) => {
    return new Promise(async (resolve, reject) => {
        if (!document || !file) {
            return reject({
                code: 500,
                error: utilities.ErrorMessages.BAD_REQUEST,
            });
        }

        const docObj = JSON.parse(document);
        const time = Date.now();
        const extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
        const dst = 'uploads/' + docObj.OwnerType + '/' + docObj.Owner + '/Document/' + time + extension;

        try {
            await uploadFileBuffer(file, dst);
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }


        const doc = new ClientResource({
            ResourceName: docObj.Name,
            Client: docObj.Owner,
            ResourceType: 'DOCUMENT',
            ResourceUrl: dst,
            Extension: extension
        });

        doc.AuditInfo = {
            CreatedByUser: docObj.Owner,
            CreationDate: new Date()
        };

        doc.save((err, saved) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }

            resolve({
                code: 200,
                data: saved
            });
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
                error: utilities.ErrorMessages.BAD_REQUEST,
            });
        }
        const query = {
            _id: image._id,
        };
        ClientResource.findOne(query, async (err, clientResource) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            } else if (!clientResource) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Resource' + utilities.ErrorMessages.NOT_FOUND,
                    },
                });
            } else {
                if (file) {
                    if (image.cropx) {
                        try {
                            file = await cropImage(image, file);
                        } catch (ex) {
                            return reject({
                                code: 500,
                                error: ex,
                            });
                        }
                    }
                    const time = Date.now();
                    const extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
                    const dst = 'uploads/Client/' + image.Client.toString() + '/Resources/Images/' + time + extension;
                    try {
                        await uploadFileBuffer(file, dst, clientResource.ResourceUrl);
                        clientResource.ResourceUrl = dst;
                    } catch (ex) {
                        return reject({
                            code: 500,
                            error: ex,
                        });
                    }
                }
                clientResource.Name = image.Name;
                clientResource.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    if (file) {
                        try {
                            fs.removeSync(file.path);
                        } catch (ex) {
                            return reject({
                                code: 500,
                                error: ex,
                            });
                        }
                    }
                    resolve({
                        code: 200,
                        data: clientResource,
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
        if (!image) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }
        const query = {
            _id: image,
        };
        ClientResource.findOneAndRemove(query, async (err, clientResource) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            } else if (!clientResource) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client' + utilities.ErrorMessages.NOT_FOUND,
                    },
                });
            } else {
                try {
                    await deleteBucketFile(clientResource.ResourceUrl);
                } catch (ex) {
                    return reject({
                        code: 500,
                        error: ex,
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
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }

        media = JSON.parse(media);
        const query = {
            _id: media.ownerid,
        };
        Client.findOne(query, {
            _id: 1
        }, async (err, client) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            } else if (!client) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client' + utilities.ErrorMessages.NOT_FOUND,
                    },
                });
            } else {
                const time = Date.now();
                const extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
                if (!file.fileType) {
                    return reject({
                        code: 400,
                        error: {
                            message: utilities.ErrorMessages.UNSUPPORTED_MEDIA_TYPE,
                        },
                    });
                }
                const dst = 'uploads/Client/' + client._id.toString() + '/Resources/Media/' + time + extension;
                try {
                    await uploadFileBuffer(file, dst);
                    const clientResource = new ClientResource({
                        Name: media.name,
                        Client: client._id,
                        Type: file.fileType,
                        ResourceUrl: dst,
                    });
                    clientResource.save((err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err,
                            });
                        }
                        if (file && file.path) {
                            try {
                                fs.removeSync(file.path);
                            } catch (ex) {
                                return reject({
                                    code: 500,
                                    error: ex,
                                });
                            }
                        }
                        resolve({
                            code: 200,
                            data: clientResource,
                        });
                    });
                } catch (ex) {
                    return reject({
                        code: 500,
                        error: ex,
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
                error: utilities.ErrorMessages.BAD_REQUEST,
            });
        }
        media = JSON.parse(media);
        const query = {
            _id: media._id,
        };
        ClientResource.findOne(query, async (err, clientResource) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            } else if (!clientResource) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Resource' + utilities.ErrorMessages.NOT_FOUND,
                    },
                });
            } else {
                if (file) {
                    const time = Date.now();
                    const extension = file.originalname.substr(file.originalname.lastIndexOf('.'));
                    if (!file.fileType) {
                        return reject({
                            code: 400,
                            error: {
                                message: utilities.ErrorMessages.UNSUPPORTED_MEDIA_TYPE,
                            },
                        });
                    }
                    const dst = 'uploads/Client/' + media.ownerid.toString() + '/Resources/Media/' + time + extension;
                    try {
                        await uploadFileBuffer(file, dst, clientResource.ResourceUrl);
                        clientResource.ResourceUrl = dst;
                    } catch (ex) {
                        return reject({
                            code: 500,
                            error: ex,
                        });
                    }
                }
                clientResource.Name = media.name || clientResource.Name;
                clientResource.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    if (file && file.path) {
                        try {
                            fs.removeSync(file.path);
                        } catch (ex) {
                            return reject({
                                code: 500,
                                error: ex,
                            });
                        }
                    }
                    resolve({
                        code: 200,
                        data: clientResource,
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
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        }
        const query = {
            _id: id,
        };
        ClientResource.findOneAndRemove(query, async (err, clientResource) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            } else if (!clientResource) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client' + utilities.ErrorMessages.NOT_FOUND,
                    },
                });
            } else {
                try {
                    await deleteBucketFile(clientResource.ResourceUrl);
                    resolve({
                        code: 200,
                        data: 'Deleted',
                    });
                } catch (ex) {
                    return reject({
                        code: 500,
                        error: ex,
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
const getAllResources = (id) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            Client: id,
        };

        ClientResource.find(query).populate('AuditInfo.EditedByUser').exec((err, clientResources) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            }
            resolve({
                code: 200,
                data: clientResources,
            });
        });
    });
};
const removeAddOnResource = (planId, resourceId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const clientAdPlan = await ClientAdPlan.findOne({
                _id: planId
            }).exec();
            clientAdPlan.AddOnAssets = clientAdPlan.AddOnAssets.filter(function (item) {
                return item.toString() != resourceId;
            });
            clientAdPlan.save();
            resolve({
                code: 200,
                data: clientAdPlan
            });
        } catch (ex) {
            return reject({
                code: 500,
                error: ex,
            });
        }
    });
};
module.exports = {
    addImageResource,
    updateImageResource,
    deleteImageResource,
    addMediaResource,
    updateMediaResource,
    deleteMediaResource,
    getAllResources,
    saveClientVideo,
    removeAddOnResource,
    addDocumentResource
};