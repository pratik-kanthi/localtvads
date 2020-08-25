const fs = require('fs-extra');
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ClientResource = require.main.require('./models/ClientResource').model;
const {
    uploadFile
} = require.main.require('./services/FileService');

const saveClientVideo = (clientAdPlan, previewPath, extension, socket) => {
    return new Promise(async (resolve, reject) => {
        try {
            const clientresource = new ClientResource({
                AssetType: 'VIDEO',
                AssetUrl: previewPath,
                Extension: extension,
            });

            clientresource.AuditInfo = {
                CreationDate: new Date(),
            };

            clientresource.save((err) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }

                ClientAdPlan.findOne({
                    _id: clientAdPlan
                }).exec((err, cadplan) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    cadplan.AdVideo = clientresource._id;
                    cadplan.save((err, saved) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err,
                            });
                        }
                        socket.emit('PROCESS_FINISHED');
                        resolve(saved);
                    });
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

const saveClientAddOnVideo = (data, previewPath, extension, socket) => {
    return new Promise(async (resolve, reject) => {
        try {
            const deletePreviewFile = () => {
                try {
                    fs.removeSync(previewPath);
                } catch (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
            };

            const dst = 'uploads/Client/' + data.client + '/ClientServiceAddOns/' + data.clientServiceAddOn + '/' + Date.now() + extension;
            try {
                await uploadFile(previewPath, dst);
                deletePreviewFile();
            } catch (ex) {
                deletePreviewFile();
                return reject({
                    code: 500,
                    error: ex,
                });
            }
            const clientResource = new ClientResource({
                AssetType: 'VIDEO',
                AssetUrl: dst,
                Extension: extension,
            });

            clientResource.save(async (err) => {
                if (err) {
                    return reject(err);
                }

                ClientAdPlan.findOne({
                    _id: data.clientAdPlan
                }).exec((err, cadplan) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    cadplan.AddOnAssets.push(clientResource._id);
                    cadplan.save((err, saved) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err,
                            });
                        }
                        socket.emit('ADDON_UPLOAD_FINISHED');
                        resolve(saved);
                    });
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

module.exports = {
    saveClientVideo,
    saveClientAddOnVideo,
};