const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;

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


module.exports = {
    saveCard
};