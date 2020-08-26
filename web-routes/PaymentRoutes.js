const passport = require('passport');
const {
    saveSubscription
} = require.main.require('./services/SubscriptionService');

module.exports = (app) => {

    app.post('/api/:clientid/createplan', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await saveSubscription(req.body.clientAdPlan, req.body.newCard, req.body.savedCard);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};