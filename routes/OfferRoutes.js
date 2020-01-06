const passport = require('passport');
const { getAllOffers, getAllOffersForStaff, saveOffer, getOffersByDuration, deleteOffer } = require.main.require('./services/OfferService');

module.exports = (app) => {

    app.get('/api/offers/all', async (req, res) => {
        try {
            const result = await getAllOffers(req.query.startdate);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/staff/offers/all', async (req, res) => {
        try {
            const result = await getAllOffersForStaff();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/offers', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await saveOffer(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/offers/byduration', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await getOffersByDuration(req.query.from, req.query.to);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.delete('/api/offers/:id', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await deleteOffer(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });
};
