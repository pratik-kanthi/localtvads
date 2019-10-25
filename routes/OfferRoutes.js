const {getAllOffers} = require.main.require('./services/OfferService');

module.exports = (app) => {
    app.get('/api/offers/all', async (req, res) => {
        try {
            const result = await getAllOffers(req.query.startdate);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};
