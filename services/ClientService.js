const Client = require.main.require('./models/Client').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;

const {saveCustomer, saveNewCardToCustomer} = require.main.require('./services/PaymentService');

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
        let query = {
            _id: clientId
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
                    let client = await _getClient(clientid);
                    let csToken = await saveCustomer(stripeToken, client.Email);
                    newClientPaymentMethod = new ClientPaymentMethod({
                        StripeCusToken: csToken.id
                    });
                    cardToken = csToken.sources.data[0];
                    isNew = true;
                } catch (err) {
                    return reject({
                        code: err.code,
                        error: err.error
                    });
                }
            } else {
                try {
                    cardToken = await saveNewCardToCustomer(isNew ? newClientPaymentMethod.StripeCusToken : clientPaymentMethod.StripeCusToken);
                    newClientPaymentMethod = new ClientPaymentMethod({
                        StripeCusToken: clientPaymentMethod.id,
                        IsPreferred: true
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
                Vendor: cardToken.brand.toUpperCase(),
                Name: cardToken.name,
                ExpiryMonth: cardToken.exp_month,
                ExpiryYear: cardToken.exp_year,
                LastFour: cardToken.last4
            };
            newClientPaymentMethod.Client = clientId;
            newClientPaymentMethod.save(err => {
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
 * Get preferred card by client
 * @param {String} clientId - _id of the client
 * @param {String} cardId - stripe's card token
 */
const getPreferredCard = (client, cardId) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            Client: client,
            _id: cardId,
            IsPreferred: true
        };
        try {
            let card = await ClientPaymentMethod.findOne(query, {CardToken: 1, CustomerToken: 1});
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

const _getClient = (client) => {
    return new Promise(async (resolve, reject) => {
        Client.findOne({_id: client}, (err, client) => {
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
    getPreferredCard
};