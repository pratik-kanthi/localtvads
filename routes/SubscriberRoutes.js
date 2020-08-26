const {
    getSubscribers,
    unsubscribeUser
} = require.main.require('./services/SubscriberService');

module.exports = (app) => {

    app.get('/api/subscribers/all', async (req, res, next) => {
        try {
            const result = await getSubscribers();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/unsubscribe', async (req, res, next) => {
        try {
            const result = await unsubscribeUser(req.body.Email);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};