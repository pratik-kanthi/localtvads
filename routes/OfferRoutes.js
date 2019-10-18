const passport = require('passport');

const {getApplicableOffers} = require.main.require('./services/OfferService');

module.exports = (app) => {
    app.get('/api/offers/all', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await getApplicableOffers(req.query.channel, req.query.adschedule, req.query.startdate);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};