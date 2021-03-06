const mongoose = require('mongoose');
const config = require.main.require('./config');
const Client = require.main.require('./models/Client').model;
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ClientResource = require.main.require('./models/ClientResource').model;

const {
    uploadFileBuffer,
} = require.main.require('./services/FileService');

const {
    cropImage
} = require.main.require('./services/ImageService');

const {
    getAllFilesByPrefix
} = require.main.require('./google-bucket');

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


const saveClientAd = (client, clientadplan, path, socket) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!client || !path || !clientadplan) {
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

            resource.Management = true;
            resource.save((err) => {
                if (err) {
                    socket.emit('PROCESS_ADMIN_ERROR');
                }

                ClientAdPlan.findOne({
                    _id: clientadplan
                }).exec((err, cplan) => {

                    if (err) {
                        socket.emit('PROCESS_ADMIN_ERROR');
                    }

                    cplan.AdVideo = resource._id;
                    cplan.save((err) => {
                        if (err) {
                            socket.emit('PROCESS_ADMIN_ERROR');
                        }
                        socket.emit('PROCESS_ADMIN_FINISHED', resource);
                    });
                });
            });

        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};


const addImageResource = (image, file) => {
    return new Promise(async (resolve, reject) => {
        try {
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
        } catch (err) {
            logger.logError('Failed to add image resource', err);
            return reject({
                code: 500,
                error: err
            });
        }

    });
};


const addDocumentResource = (document, file) => {
    return new Promise(async (resolve, reject) => {
        try {
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
        } catch (err) {
            logger.logError('Failed to upload document', err);
            return reject({
                code: 500,
                error: err
            });
        }
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
            logger.logError(`Failed to remove resource ${resourceId} for plan ${planId}`, ex);
            return reject({
                code: 500,
                error: ex,
            });
        }
    });
};

const getAllResources = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
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
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }

    });
};

const getClientStorage = (clientid) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!clientid) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }


            const response = {};
            response.total_used = 0;
            const clientresources = await getAllFilesByPrefix(`uploads/Client/${clientid}`);

            clientresources[0].map(resource => {
                response.total_used += parseFloat(resource.metadata.size);
                return resource;
            });
            response.total_used = parseFloat(response.total_used) / (1000 * 1000);
            response.total_used = parseFloat(response.total_used.toFixed(2));
            response.total_available = config.google_bucket.client_max_size - response.total_used;

            response.Client = clientid;
            response.block_size = 'MB';

            resolve({
                code: 200,
                data: response
            });

        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};


module.exports = {
    addImageResource,
    saveClientVideo,
    removeAddOnResource,
    addDocumentResource,
    saveClientAd,
    getAllResources,
    getClientStorage
};