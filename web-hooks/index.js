const {
    subscriptionPaymentSucess,
    subscriptionPaymentFailure
} = require.main.require('./services/WebHookService');

module.exports = (app) => {
    app.post('/stripe-webhook', async (request, response) => {
        let event, invoiceObj;

        try {
            event = request.body;
        } catch (err) {
            response.status(400).send(`Webhook Error: ${err.message}`);
        }


        if (event.type == 'invoice.payment_succeeded') {
            invoiceObj = event.data.object;
            try {
                await subscriptionPaymentSucess(invoiceObj);
                logger.logInfo('Webhook called for payment success', invoiceObj);
                return response.status(200).end();
            } catch (err) {
                logger.logError('Webhook failed', err);
                return response.status(400).end();
            }
        }

        if (event.type == 'invoice.payment_failure') {
            invoiceObj = event.data.object;
            try {
                await subscriptionPaymentFailure(invoiceObj);
                logger.logInfo('Webhook called for payment failure', invoiceObj);
                return response.status(200).end();
            } catch (err) {
                logger.logError('Webhook failed', err);
                return response.status(400).end();
            }
        }
    });
};