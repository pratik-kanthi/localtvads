const Client = require.main.require('./models/Client').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;

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

        let isNew = false;
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
                    isNew = true;
                    newClientPaymentMethod.IsPreferred = true;
                } catch (err) {
                    return reject({
                        code: err.code,
                        error: err.error
                    });
                }
            } else {
                try {
                    cardToken = await saveNewCardToCustomer(
                        stripeToken,
                        isNew ? newClientPaymentMethod.StripeCusToken : clientPaymentMethod.StripeCusToken
                    );
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
                Vendor: cardToken.brand.toUpperCase(),
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
    setPreferredCard
};
