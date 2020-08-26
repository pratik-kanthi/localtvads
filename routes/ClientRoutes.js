const passport = require('passport');
const {
    fetchClientsByPage
} = require.main.require('./services/ClientService');


module.exports = (app) => {

    app.get('/api/clients/byPage', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await fetchClientsByPage(parseInt(req.query.page), parseInt(req.query.size), req.query.sortBy);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};