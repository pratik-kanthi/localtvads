const Transaction = require.main.require('./models/Transaction').model;
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const { uploadFile } = require.main.require('./services/FileService');
const email = require('../email');
const moment = require('moment');
const config = require.main.require('./config');

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

            const project = {
                Client: 1,
                ClientAdPlan: 1,
                TotalAmount: 1,
                ReferenceId: 1,
                DateTime: 1,
                TaxBreakdown: 1,
            };

            const populateOptions = [
                {
                    path: 'Client',
                    model: 'Client',
                },
                {
                    path: 'ClientAdPlan',
                    populate: [
                        {
                            path: 'Channel',
                            model: 'Channel',
                        },
                        {
                            path: 'AddOns',
                        },
                    ],
                },
            ];

            let transaction;
            try {
                transaction = await Transaction.findOne(query, project).populate(populateOptions).exec();

                if (transaction.ReceiptUrl) {
                    resolve({
                        code: 200,
                        data: transaction.ReceiptUrl,
                    });
                }

                const receipt = {
                    InvoiceNo: transaction.ReferenceId,
                    Date: moment(transaction.DateTime).format('DD/MM/YYYY'),
                    Name: transaction.ClientAdPlan.Channel.Name + '_' + transaction.ClientAdPlan.ChannelProduct.ProductLength.Name,
                    TotalAmount: transaction.TotalAmount.toFixed(2),
                    TaxBreakdown: transaction.TaxBreakdown[0],
                };

                receipt.User = {};
                receipt.User.Name = transaction.Client.Name;
                receipt.User.Email = transaction.Client.Email;
                receipt.User.Phone = transaction.Client.Phone;

                const message = email.helper.downloadReceipt(receipt);
                const filePath = path.join(__dirname, '../receipts/' + transaction_id + '.pdf');
                const options = {
                    format: 'A4',
                    orientation: 'portrait',
                };

                pdf.create(message, options).toFile(filePath, (err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    const bucket_file_path = 'uploads/clients/' + transaction.Client._id + '/transactions/' + moment().format('DD_MM_YYYY') + '_' + transaction_id + '.pdf';
                    const uploadPromise = uploadFile(filePath, bucket_file_path);
                    const receipt_bucket_url = config.google_bucket.bucket_url + bucket_file_path;

                    Promise.all([uploadPromise])
                        .then(() => {
                            transaction.ReceiptUrl = receipt_bucket_url;
                            transaction.save((err, tr) => {
                                if (err) {
                                    return reject({
                                        code: 500,
                                        error: err,
                                    });
                                }
                                fs.unlinkSync(filePath);
                                resolve({
                                    code: 200,
                                    data: tr.ReceiptUrl,
                                });
                            });
                        })
                        .catch((err) => {
                            return reject({
                                code: 500,
                                error: err,
                            });
                        });
                });
            } catch (err) {
                return reject({
                    code: 500,
                    error: err,
                });
            }
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

module.exports = {
    generateTransactionReceipt,
};
