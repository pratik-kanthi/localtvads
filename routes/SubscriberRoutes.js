const { getSubscribers } = require.main.require('./services/SubscriberService');

module.exports = (app) => {
    app.get('/api/subscribers/all', async (req, res) => {
        try {
            const result = await getSubscribers();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};