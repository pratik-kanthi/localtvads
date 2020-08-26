const passport = require('passport');

const {
    saveServiceAddOn
} = require.main.require('./services/AddOnService');

module.exports = (app) => {
    app.post('/api/serviceaddons', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await saveServiceAddOn(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};