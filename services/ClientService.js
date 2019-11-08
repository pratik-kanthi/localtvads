const AdSchedule = require.main.require('./models/AdSchedule').model;
const Channel = require.main.require('./models/Channel').model;
const Client = require.main.require('./models/Client').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;
const Transaction = require.main.require('./models/Transaction').model;

const moment = require('moment');
const email = require('../email');
const pdf = require('html-pdf');
const path = require('path');
const { saveCustomer, saveNewCardToCustomer, deleteCardFromStripe } = require.main.require('./services/PaymentService');

/*
 * Add card to a client
 * @param {String} clientId - _id of the client
 * @param {String} stripeToken - token of stripe
 */
const addCard = (clientId, stripeToken) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            Client: clientId
        };

        let newClientPaymentMethod;
        let cardToken;

        ClientPaymentMethod.findOne(query, async (err, clientPaymentMethod) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!clientPaymentMethod) {
                try {
                    const client = await _getClient(clientId, { Email: 1 });
                    const csToken = await saveCustomer(stripeToken, client.Email);
                    newClientPaymentMethod = new ClientPaymentMethod({
                        StripeCusToken: csToken.id
                    });
                    cardToken = csToken.sources.data[0];
                    newClientPaymentMethod.IsPreferred = true;
                } catch (err) {
                    return reject({
                        code: err.code,
                        error: err.error
                    });
                }
            } else {
                try {
                    cardToken = await saveNewCardToCustomer(stripeToken, clientPaymentMethod.StripeCusToken);
                    newClientPaymentMethod = new ClientPaymentMethod({
                        StripeCusToken: clientPaymentMethod.StripeCusToken
                    });
                } catch (ex) {
                    return reject({
                        code: ex.code,
                        error: ex.error
                    });
                }
            }
            newClientPaymentMethod.Card = {
                PaymentMethodType: 'CARD',
                StripeCardToken: cardToken.id,
                Vendor: cardToken.brand.toUpperCase().replace(/ +/g, ''), // avoid space in filenames and tp match with image files
                Name: cardToken.name,
                ExpiryMonth: cardToken.exp_month,
                ExpiryYear: cardToken.exp_year,
                LastFour: cardToken.last4
            };
            newClientPaymentMethod.Client = clientId;
            newClientPaymentMethod.save((err) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                resolve({
                    code: 200,
                    data: newClientPaymentMethod
                });
            });
        });
    });
};

/*
 * Get saved cards by a client
 * @param {String} clientId - _id of the client
 */
const getSavedCards = (clientId) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            Client: clientId
        };
        const project = {
            _id: 1,
            IsPreferred: 1,
            'Card.Vendor': 1,
            'Card.Name': 1,
            'Card.ExpiryMonth': 1,
            'Card.ExpiryYear': 1,
            'Card.LastFour': 1
        };
        ClientPaymentMethod.find(query, project).sort({ IsPreferred: -1 }).exec((err, cards) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: cards
            });
        });
    });
};

/*
 * Get preferred card by client
 * @param {String} clientId - _id of the client
 * @param {String} cardId - stripe's card token
 */
const getPreferredCard = (clientId, cardId) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId || !cardId) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
            Client: clientId,
            _id: cardId,
            IsPreferred: true
        };
        try {
            const card = await ClientPaymentMethod.findOne(query, { CardToken: 1, CustomerToken: 1 });
            if (!card) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Card' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            }
            resolve(card);
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

/*
 * Set preferred card by client
 * @param {String} clientId - _id of the client
 * @param {String} cardId - stripe's card token
 */
const setPreferredCard = (clientId, cardId) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId || !cardId) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let query = {
                Client: clientId,
                IsPreferred: true
            }, card;
        try {
            card = await ClientPaymentMethod.findOne(query);
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
        if (card) {
            card.IsPreferred = false;
            try {
                await card.save();
            } catch (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            card = undefined;
        }

        query = {
            Client: clientId,
            _id: cardId
        };
        try {
            card = await ClientPaymentMethod.findOne(query);
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
        if (card) {
            card.IsPreferred = true;
            try {
                await card.save();
                resolve({
                    code: 200,
                    data: undefined
                });
            } catch (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
        } else {
            return reject({
                code: 404,
                error: {
                    message: 'Card' + utilities.ErrorMessages.NOT_FOUND
                }
            });
        }
    });
};

const deleteCard = (clientId, cardId) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId || !cardId) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let count = 0, query = {
            Client: clientId
        };
        try {
            count = await ClientPaymentMethod.countDocuments(query);
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });

        }
        if (count < 2) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.DELETE_CARD_NOT_ALLOWED
                }
            });
        }
        try {
            query = {
                Client: clientId,
                _id: cardId
            };
            const card = await ClientPaymentMethod.findOne(query);
            if (!card) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Card' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else if (card && card.IsPreferred) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Card' + utilities.ErrorMessages.DELETE_CARD_NOT_ALLOWED
                    }
                });
            } else {
                try {
                    await ClientPaymentMethod.findOneAndRemove(query);
                } catch (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                await deleteCardFromStripe(card.StripeCusToken, card.Card.StripeCardToken);
                resolve({
                    code: 200,
                    data: undefined
                });
            }
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const getTransactions = (clientId) => {
    return new Promise(async (resolve, reject) => {
        if (!clientId) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const query = {
                Client: clientId
            }, project = {
                ChannelPlan: 1,
                TotalAmount: 1,
                DateTime: 1,
                Status: 1,
                ReferenceId: 1,
                ClientAdPlan: 1,
                ServiceAddOn: 1,
                ClientServiceAddOn: 1
            };
        const populateOptions = [
            {
                path: 'ChannelPlan.Channel',
                model: Channel,
                select: {
                    'Name': 1,
                    _id: 0
                }
            },
            {
                path: 'ChannelPlan.AdSchedule',
                model: AdSchedule,
                select: {
                    'Name': 1,
                    _id: 0
                }
            }
        ];
        Transaction.find(query, project).populate(populateOptions).sort({ DateTime: -1 }).exec((err, transactions) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: transactions
            });
        });
    });
};

const generateReceipt = (transaction_id) => {
    return new Promise(async (resolve, reject) => {
        if (!transaction_id) {
            return reject({
                code: 500,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        } else {
            const query = {
                ReferenceId: transaction_id
            };
            const project = {
                Client: 1,
                ChannelPlan: 1,
                TotalAmount: 1,
                DateTime: 1,
                Status: 1,
                ReferenceId: 1,
                ClientAdPlan: 1,
                ServiceAddOn: 1,
                ClientServiceAddOn: 1,
                TaxBreakdown: 1
            };
            const populateOptions = [
                {
                    path: 'Client',
                    model: Client,
                    select: {
                        'Name': 1,
                        'Email': 1,
                        'Phone': 1
                    }
                },
                {
                    path: 'ChannelPlan.Channel',
                    model: Channel,
                    select: {
                        'Name': 1,
                        _id: 0
                    }
                },
                {
                    path: 'ChannelPlan.AdSchedule',
                    model: AdSchedule,
                    select: {
                        'Name': 1,
                        _id: 0
                    }
                }
            ];

            Transaction.findOne(query, project).populate(populateOptions).exec((err, transaction) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }

                const receipt = {
                    InvoiceNo: transaction_id,
                    Date: moment(transaction.DateTime).format('DD/MM/YYYY'),
                    Type: transaction.ServiceAddOn ? 'Add On' : 'Ad Slot',
                    Name: transaction.ServiceAddOn ? transaction.ServiceAddOn.Name : transaction.ChannelPlan.Channel.Name,
                    TotalAmount: transaction.TotalAmount,
                    SubTotal: transaction.ServiceAddOn ? transaction.ServiceAddOn.SubTotal : transaction.ChannelPlan.SubTotal,
                    TaxAmount: transaction.ServiceAddOn ? transaction.ServiceAddOn.TaxAmount : transaction.ChannelPlan.TaxAmount,
                    TaxBreakdown: transaction.TaxBreakdown[0]

                };

                receipt.User = {};
                receipt.User.Name = transaction.Client.Name;
                receipt.User.Email = transaction.Client.Email;
                receipt.User.Phone = transaction.Client.Phone;

                const message = email.helper.downloadReceipt(receipt);
                const filePath = path.join(__dirname, '../receipts/' + transaction_id + '.pdf');
                const options = {
                    height: '6.27in',
                    width: '5.83in'
                };

                pdf.create(message, options).toFile(filePath, (err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    resolve({
                        code: 200,
                        filePath: filePath
                    });

                });
            });
        }
    });
};

const _getClient = (client, projection) => {
    return new Promise(async (resolve, reject) => {
        Client.findOne({ _id: client }, projection || {}, (err, client) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else {
                resolve(client);
            }
        });
    });
};

module.exports = {
    addCard,
    deleteCard,
    getPreferredCard,
    getSavedCards,
    setPreferredCard,
    getTransactions,
    generateReceipt
};
