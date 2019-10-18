const passport = require('passport');

const {addCard} = require.main.require('./services/ClientService');
const {getActiveAddOns, saveAddOn} = require.main.require('./services/AddOnService');

module.exports = (app) => {
    app.post('/api/serviceaddons/save', passport.authenticate('jwt', {session: false}), async (req, res) => {
        let card;
        if (req.body.save && !req.body.cardid) {
            try {
                card = await addCard(req.body.client, req.body.token);
            } catch (err) {
                return res.status(err.code).send(err.error);
            }
        }
        try {
            const result = await saveAddOn(req.body.addon, req.body.client, req.body.cardid ? req.body.cardid : card ? card.data._id : undefined, req.body.token);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/serviceaddons/all', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await getActiveAddOns();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};