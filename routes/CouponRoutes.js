const passport = require('passport');
const {
    saveCoupon,
    getCouponsByDuration,
    getAllCoupons
} = require.main.require('./services/CouponService');

module.exports = (app) => {
    app.post('/api/coupons', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await saveCoupon(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/coupons/byduration', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await getCouponsByDuration(req.query.from, req.query.to);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/coupons/all', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await getAllCoupons();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};