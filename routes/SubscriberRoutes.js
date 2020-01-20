const passport = require('passport');
const { getSubscribers, unsubscribeUser, fetchSubscribersByPage } = require.main.require('./services/SubscriberService');

module.exports = (app) => {

    app.get('/api/subscribers/all', async (req, res) => {
        try {
            const result = await getSubscribers();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/unsubscribe', async (req, res) => {
        try {
            const result = await unsubscribeUser(req.body.Email);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/subscribers/byPage', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await fetchSubscribersByPage(parseInt(req.query.page), parseInt(req.query.size), req.query.sortBy);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};