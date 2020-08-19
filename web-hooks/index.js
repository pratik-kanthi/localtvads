const config = require.main.require('./config');
const stripe = require('stripe')(config.stripe.secret);
const bodyParser = require('body-parser');


module.exports = (app) => {

    app.post(
        '/stripe-webhook',
        bodyParser.raw({
            type: 'application/json'
        }),
        async (req, res) => {
            let event;
            try {
                event = stripe.webhooks.constructEvent(
                    req.body,
                    req.headers['stripe-signature'],
                    process.env.STRIPE_WEBHOOK_SECRET
                );
            } catch (err) {
                return res.sendStatus(400);
            }
            switch (event.type) {
            case 'invoice.paid':
                break;
            case 'invoice.payment_failed':
                break;
            case 'invoice.finalized':
                break;
            default:
                break;
            }
            res.sendStatus(200);
        }
    );
};