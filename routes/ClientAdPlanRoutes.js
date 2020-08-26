const passport = require('passport');
const {
    getAllClientAdPlans
} = require.main.require('./services/ClientAdPlanService');

module.exports = (app) => {

    app.get('/api/getallclientadplans', passport.authenticate('jwt', {
        session: false,
    }), async (req, res) => {
        try {
            const result = await getAllClientAdPlans(req.query.page, req.query.top, req.query.sort, req.query.Status, req.query.Channel, req.query.Client);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};