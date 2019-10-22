const async = require('async');
const fs = require('fs');

const ClientResource = require.main.require('./models/ClientResource').model;
const ClientServiceAddOn = require.main.require('./models/ClientServiceAddOn').model;
const ServiceAddOn = require.main.require('./models/ServiceAddOn').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;
const Transaction = require.main.require('./models/Transaction').model;
const Tax = require.main.require('./models/Tax').model;

const {uploadFile} = require.main.require('./services/FileService');
const {chargeByCard, chargeByExistingCard} = require.main.require('./services/PaymentService');
const {getTaxes} = require.main.require('./services/TaxService');

const saveClientServiceAddOn = (addon, clientId, cardId, token) => {
    return new Promise(async (resolve, reject) => {
        if (!addon || !clientId) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            IsActive: true,
            _id: addon
        };
        ServiceAddOn.findOne(query, async (err, addOn) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!addOn) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Service Add On' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                let card, taxes, taxAmount = 0;
                if (cardId) {
                    const query = {
                        Client: clientId,
                        _id: cardId
                    };
                    try {
                        card = await ClientPaymentMethod.findOne(query, {
                            'Card.StripeCardToken': 1,
                            StripeCusToken: 1
                        });
                    } catch (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    if (!card) {
                        return reject({
                            code: 404,
                            error: {
                                message: 'Card' + utilities.ErrorMessages.NOT_FOUND
                            }
                        });
                    }
                }
                try {
                    const taxResult = await getTaxes(addOn.Amount);
                    taxes = taxResult.taxes;
                    taxAmount = taxResult.totalTax;
                } catch (ex) {
                    return reject({
                        code: ex.code || 500,
                        error: ex.error
                    });
                }

                let charge, func;
                if (card) {
                    func = chargeByExistingCard(addOn.Amount, card.StripeCusToken, card.Card.StripeCardToken);
                } else {
                    func = chargeByCard(addOn.Amount, token);
                }
                try {
                    charge = await func;
                } catch (err) {
                    return reject({
                        code: err.code,
                        error: err.error
                    });
                }

                const clientServiceAddOn = new ClientServiceAddOn({
                    Client: clientId,
                    ServiceAddOn: addOn._id,
                    Images: [],
                    Videos: []
                });
                clientServiceAddOn.save(err => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    const transaction = new Transaction({
                        Client: clientId,
                        ServiceAddOn: {
                            ...addOn.toObject(),
                            SubTotal: addOn.Amount,
                            TaxAmount: taxAmount
                        },
                        ClientServiceAddOn: clientServiceAddOn._id,
                        TotalAmount: addOn.Amount + taxAmount,
                        Status: 'succeeded',
                        StripeResponse: charge,
                        ReferenceId: charge.id,
                        TaxBreakdown: taxes
                    });
                    transaction.save((err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }
                        resolve({
                            code: 200,
                            data: transaction
                        });
                    });
                });
            }
        });
    });
};

const getActiveAddOns = () => {
    return new Promise(async (resolve, reject) => {
        await async.parallel({
            addOns: (callback) => {
                const query = {
                    IsActive: true
                };
                ServiceAddOn.find(query, (err, addOns) => {
                    if (err) {
                        return callback(err, null);
                    }
                    callback(null, addOns);
                });
            },
            taxes: (callback) => {
                const query = {
                    Active: true
                };
                Tax.find(query, (err, taxes) => {
                    if (err) {
                        return callback(err, null);
                    }
                    callback(null, taxes);
                });
            }
        }, (err, result) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                const responseObj = [];
                if (result.taxes && result.addOns) {
                    result.addOns.forEach(addOn => {
                        addOn = addOn.toObject();
                        let taxAmount = 0;
                        result.taxes.forEach(tax => {
                            if (tax.Type === 'FIXED') {
                                taxAmount += tax.Value;
                            } else {
                                taxAmount += tax.Value * 0.01 * addOn.Amount;
                            }
                        });
                        responseObj.push({...addOn, TaxAmount: taxAmount, TotalAmount: addOn.Amount + taxAmount});
                    });
                }
                resolve({
                    code: 200,
                    data: responseObj
                });
            }
        });

    });
};

/**
 * Upload ClientAd video
 * @param {Object} data - data for Client, ServiceAddOn, Name of file
 * @param {String} previewPath - Path where intermediate video is stored
 * @param {String} extension - Extension of the video
 * @param {Object} socket - socket connection through which event will be sent
 */
const uploadVideoForAddOns = (data, previewPath, extension, socket) => {
    return new Promise(async (resolve, reject) => {
        const deletePreviewFile = () => {
            try {
                fs.removeSync(previewPath);
            } catch (err) {
                return reject({
                    code: 500,
                    error: err
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
                error: ex
            });
        }
        const clientResource = new ClientResource({
            Name: data.name.replace(extension, ''),
            Client: data.client,
            Type: 'VIDEO',
            ResourceUrl: dst
        });
        clientResource.save(async err => {
            if (err) {
                return reject(err);
            }
            socket.emit('UPLOAD_FINISHED', clientResource._id);
            resolve(clientResource);
        });
    });
};

const getClientServiceAddOn = (clientServiceAddOnId) => {
    return new Promise(async (resolve, reject) => {
        if (!clientServiceAddOnId) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            _id: clientServiceAddOnId
        };
        ClientServiceAddOn.findOne(query).populate('Images Videos').exec((err, clientServiceAddOn) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!clientServiceAddOn) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client Add On' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                resolve({
                    code: 200,
                    data: clientServiceAddOn
                });
            }
        });
    });
};

const updateClientServiceAddOn = (id, images, videos) => {
    return new Promise(async (resolve, reject) => {
        if (!id || !images.length && !videos.length) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            _id: id
        };
        ClientServiceAddOn.findOne(query, (err, clientServiceAddOn) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!clientServiceAddOn) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Client Add-On' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                clientServiceAddOn.Images = images;
                clientServiceAddOn.Videos = videos;
                clientServiceAddOn.save(err => {
                    if(err){
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    resolve({
                        code: 200,
                        data: clientServiceAddOn
                    });
                });
            }
        });
    });
};

module.exports = {
    getActiveAddOns,
    getClientServiceAddOn,
    saveClientServiceAddOn,
    updateClientServiceAddOn,
    uploadVideoForAddOns
};
