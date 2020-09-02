const passport = require('passport');
const {
    getAllClientAdPlans
} = require.main.require('./services/ClientAdPlanService');

module.exports = (app) => {

    app.get('/api/getallclientadplans', passport.authenticate('jwt', {
        session: false,
    }), async (req, res, next) => {
        try {
            const result = await getAllClientAdPlans(req.query.page, req.query.top, req.query.sort, req.query.Status, req.query.Channel, req.query.Client);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};