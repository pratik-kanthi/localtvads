const {
    createSubscriptionCustomer
} = require.main.require('./services/SubscriptionService');

module.exports = (app) => {
    app.post('/api/subscriptions', async (req, res) => {
        try {
            const result = await createSubscriptionCustomer(req.body.name, req.body.email);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};