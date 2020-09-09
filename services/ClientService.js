const Client = require.main.require('./models/Client').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;
const Transaction = require.main.require('./models/Transaction').model;

const moment = require('moment');
const email = require('../email');
const pdf = require('html-pdf');
const path = require('path');
const config = require.main.require('./config');
const fs = require('fs');
const {
    uploadFile
} = require.main.require('./services/FileService');


const saveCard = (clientId, newCard) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!clientId || !newCard.id) {
                logger.logError('Failed to saved card, required details missing');
                return reject({
                    code: 400,
                    error: {
                        message: 'Required card details missing'
                    },
                });
            }
            const card = new ClientPaymentMethod({
                Client: clientId,
                StripeCardToken: newCard.id,
                Card: {
                    PaymentMethodType: 'CARD',
                    Vendor: newCard.card.brand,
                    Name: newCard.CardName,
                    ExpiryMonth: newCard.card.exp_month,
                    ExpiryYear: newCard.card.exp_year,
                    LastFour: newCard.card.last4,
                }
            });

            const result = await card.save();
            logger.logInfo(`Saved new card ${result._id} to user ${clientId}`);
            resolve(result);

        } catch (err) {
            logger.logError('Failed to saved card', err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const getSavedCards = (clientId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!clientId) {
                return reject({
                    code: 500,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                Client: clientId,
            };
            const project = {
                _id: 1,
                IsPreferred: 1,
                'Card.Vendor': 1,
                'Card.Name': 1,
                'Card.ExpiryMonth': 1,
                'Card.ExpiryYear': 1,
                'Card.LastFour': 1,
            };
            const cards = await ClientPaymentMethod.find(query, project).sort({
                IsPreferred: -1
            }).exec();
            resolve({
                code: 200,
                data: cards,
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const getTransactions = (clientId, planId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!clientId) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                ...clientId && {
                    Client: clientId,
                },
                ...planId && {
                    ClientAdPlan: planId,
                }
            };
            const transactions = await Transaction.find(query).sort('-DateTime').lean().exec();
            resolve({
                code: 200,
                data: transactions,
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const generateTransactionReceipt = (transaction_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!transaction_id) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }

            const query = {
                _id: transaction_id,
            };
            const transaction = await Transaction.findOne(query).deepPopulate('Client ClientAdPlan.Channel ClientAdPlan.AddOns').exec();
            const receipt = {
                ReceiptNumber: transaction.ReceiptNo,
                PaymentReference: transaction.ReferenceId,
                Date: moment(transaction.DateTime).format('DD/MM/YYYY'),
                PlanName: transaction.ClientAdPlan.Channel.Name + '_' + transaction.ClientAdPlan.ChannelProduct.ProductLength.Name,
                PlanAmount: transaction.ClientAdPlan.WeeklyAmount.toFixed(2),
                SubTotal: transaction.Amount.toFixed(2),
                TaxAmount: transaction.TaxAmount.toFixed(2),
                TotalAmount: transaction.TotalAmount.toFixed(2),
                TaxBreakdown: transaction.TaxBreakdown,
            };

            if (transaction.ClientAdPlan.Addons && transaction.ClientAdPlan.Addons.length > 0) {
                receipt.AddOn = transaction.ClientAdPlan.Addons[0].Name;
                receipt.AddOnAmount = transaction.ClientAdPlan.AddonsAmount;
            }

            receipt.User = {};
            receipt.User.Name = transaction.Client.Name;
            receipt.User.Email = transaction.Client.Email;
            receipt.User.Phone = transaction.Client.Phone;

            let message = '';

            try {
                message = email.helper.downloadReceipt(receipt);
            } catch (err) {
                logger.logError(`Failed to generate html from ejs for transaction ${transaction._id}`, err);
                return reject({
                    code: 500,
                    error: err
                });
            }

            const filePath = path.join(__dirname, '../receipts/' + transaction_id + '.pdf');
            const options = {
                format: 'A4',
                orientation: 'portrait',
            };
            pdf.create(message, options).toFile(filePath, async (err) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                const bucket_file_path = 'uploads/clients/' + transaction.Client._id + '/transactions/' + moment().format('DD_MM_YYYY_HH:mm:ss') + '_' + transaction_id + '.pdf';
                const receipt_bucket_url = config.google_bucket.bucket_url + bucket_file_path;
                transaction.ReceiptUrl = receipt_bucket_url;

                try {
                    await uploadFile(filePath, bucket_file_path);
                } catch (err) {
                    logger.logError(`Failed to upload transaction to bucket ${transaction._id}`, err);
                    return reject({
                        code: 500,
                        error: err
                    });
                }

                try {
                    const tr = await transaction.save();
                    fs.unlinkSync(filePath);
                    resolve({
                        code: 200,
                        data: tr.ReceiptUrl,
                    });
                } catch (err) {
                    logger.logWarning(`Failed to update transaction with receipet url for ${transaction._id}`, err);
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const fetchClientsByPage = (page, size, sortby) => {
    return new Promise(async (resolve, reject) => {
        try {
            page = parseInt(page) - 1;
            const client = await Client.find({})
                .skip(page * size)
                .limit(size)
                .sort(sortby)
                .exec();

            resolve({
                code: 200,
                data: client,
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
    saveCard,
    getSavedCards,
    getTransactions,
    generateTransactionReceipt,
    fetchClientsByPage,
};