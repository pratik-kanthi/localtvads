const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;
const ChannelPlan = require.main.require('./models/ChannelPlan').model;
const Transaction = require.main.require('./models/Transaction').model;

const {chargeByExistingCard} = require.main.require('./services/PaymentService');

/**
 * Renew ClientAdPlan manually
 * @param {Object} clientAdPlan - object of ClientAdPlan
 * @param {Object} cardId - Stripe token of the card
 */
const renewClientAdPlan = (clientAdPlan, cardId) => {
    return new Promise(async (resolve, reject) => {
        if (!clientAdPlan || !cardId) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let query = {
            _id: clientAdPlan
        };
        ClientAdPlan.findOne(query, async (err, cAdPlan) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                })
            } else if (!cAdPlan) {
                if (err) {
                    return reject({
                        code: 404,
                        error: {
                            message: 'Ad Plan' + utilities.ErrorMessages.NOT_FOUND
                        }
                    });
                }
            }

            let card;
            if (cardId) {
                try {
                    card = await _getPreferredCard(clientAdPlan.Client, cardId);
                } catch (err) {
                    return reject({
                        code: err.code,
                        error: err.error
                    });
                }
            }

            let charge;
            try {
                charge = await chargeByExistingCard(cAdPlan.ChannelPlan.TotalAmount, card.CustomerToken, card.CardToken);

            } catch (err) {
                return reject({
                    code: err.code,
                    error: err.error
                });
            }

            let transaction = new Transaction({
                ChannelPlan: cAdPlan.ChannelPlan,
                Client: cAdPlan.Client,
                ClientAdPlan: cAdPlan,
                TotalAmount: cAdPlan.ChannelPlan.TotalAmount,
                Status: 'succeeded',
                StripeResponse: charge
            });
            transaction.save(err => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }

                cAdPlan.save(err => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    resolve({
                        code: 200,
                        data: cAdPlan
                    });
                });
            });
        });
    });
};

/**
 * Save ClientAdPlan based on duration and ad length
 * @param {Object} clientAdPlan - object of ClientAdPlan
 * @param {Object} channelPlan - object of ChannelPlan
 * @param {Object} extras - addons selected by the client on top of the cost of ad
 * @param {Object} cardId - Stripe token of the card
 */
const saveClientAdPlan = (clientAdPlan, channelPlan, extras, cardId) => {
    return new Promise(async (resolve, reject) => {
        if (!channelPlan || !clientAdPlan || clientAdPlan.Client || clientAdPlan.Name || clientAdPlan.StartDate || clientAdPlan.EndDate) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        let query = {
            _id: channelPlan
        };

        ChannelPlan.findOne(query, async (err, chAdPlan) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if (!clientAdPlan) {
                return reject({
                    code: 404,
                    error: {
                        message: 'The chosen plan' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                let card;
                if (cardId) {
                    let query = {
                        Client: clientAdPlan.Client,
                        _id: cardId,
                        IsPreferred: true
                    };
                    try {
                        card = await ClientPaymentMethod.findOne(query, {CardToken: 1, CustomerToken: 1});
                        if (!card) {
                            return reject({
                                code: 404,
                                error: {
                                    message: 'Card' + utilities.ErrorMessages.NOT_FOUND
                                }
                            });
                        }
                    } catch (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                }

                let cAdPlan = new ClientAdPlan({
                    Name: clientAdPlan.Name,
                    Description: clientAdPlan.Description,
                    Client: clientAdPlan.Client,
                    StartDate: new Date(clientAdPlan.StartDate),
                    EndDate: new Date(clientAdPlan.EndDate),
                    IsRenewal: clientAdPlan.IsRenewal,
                    Status: 'ACTIVE',
                    ChannelPlan: {
                        Plan: chAdPlan,
                        Extras: extras || [],
                        Discount: 0,
                        Surge: 0,
                        SubTotal: 0,
                        TaxAmount: 0,
                        TotalAmount: 0
                    }
                });

                let charge;
                try {
                    charge = await chargeByExistingCard(cAdPlan.ChannelPlan.TotalAmount, card.CustomerToken, card.CardToken);
                } catch (err) {
                    return reject({
                        code: err.code,
                        error: err.error
                    });
                }

                let transaction = new Transaction({
                    ChannelPlan: chAdPlan,
                    Client: clientAdPlan.Client,
                    ClientAdPlan: cAdPlan._id,
                    TotalAmount: cAdPlan.ChannelPlan.TotalAmount,
                    Status: 'succeeded',
                    StripeResponse: charge
                });
                transaction.save(err => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err
                        });
                    }
                    cAdPlan.save(err => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err
                            });
                        }
                        resolve({
                            code: 200,
                            data: cAdPlan
                        });
                    });
                });
            }
        });
    });
};

const _getPreferredCard = (client, cardId) => {
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

module.exports = {
    saveClientAdPlan,
    renewClientAdPlan
};





