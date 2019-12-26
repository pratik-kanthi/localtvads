const passport = require('passport');
const { saveCoupon } = require.main.require('./services/CouponService');

module.exports = (app) => {
    app.post('/api/coupons', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await saveCoupon(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};
