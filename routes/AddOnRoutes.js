const passport = require('passport');

const {
    saveServiceAddOn
} = require.main.require('./services/AddOnService');

module.exports = (app) => {
    app.post('/api/serviceaddons', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await saveServiceAddOn(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};