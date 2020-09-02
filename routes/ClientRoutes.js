const passport = require('passport');
const {
    fetchClientsByPage
} = require.main.require('./services/ClientService');


module.exports = (app) => {

    app.get('/api/clients/byPage', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await fetchClientsByPage(parseInt(req.query.page), parseInt(req.query.size), req.query.sortBy);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};