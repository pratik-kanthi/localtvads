const {
    subscriptionPaymentSucess
} = require.main.require('./services/WebHookService');

module.exports = (app) => {
    app.post('/stripe-webhook', async (request, response) => {
        let event, invoiceObj;

        try {
            event = request.body;
        } catch (err) {
            response.status(400).send(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
        case 'invoice.payment_succeeded':
            invoiceObj = event.data.object;
            try {
                await subscriptionPaymentSucess(invoiceObj);
                return response.status(200).end();
            } catch (err) {
                return response.status(400).end();
            }
        case 'invoice.payment_failed':
            invoiceObj = event.data.object;
            //handle payment failures
            break;
        default:
            // Unexpected event type
            return response.status(400).end();
        }

        // Return a response to acknowledge receipt of the event
        response.json({
            received: true
        });
    });
};