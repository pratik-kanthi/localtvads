const config = require.main.require('./config');
const stripe = require('stripe')(config.stripe.secret);

module.exports = (app) => {
    app.post(
        '/stripe-webhook',
        async (req, res) => {
            let event;
            try {
                event = stripe.webhooks.constructEvent(
                    req.body
                );
            } catch (err) {
                return res.sendStatus(400);
            }
            switch (event.type) {
            case 'invoice.paid':
                break;
            default:
                break;
            }
            res.sendStatus(200);
        }
    );
};