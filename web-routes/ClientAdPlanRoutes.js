const passport = require('passport');
const {
    getClientAdPlans,
    getClientAdPlan,
    attachVideo,
    attachImages,
    updateClientAdPlan,
    updatePlanPayment
} = require.main.require('./services/ClientAdPlanService');

module.exports = (app) => {
    app.get('/api/:clientid/clientadplans', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await getClientAdPlans(req.params.clientid);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });


    app.get('/api/:clientid/clientadplans/:planid', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await getClientAdPlan(req.params.clientid, req.params.planid);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/:clientid/clientadplans/:planid', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await updateClientAdPlan(req.params.planid, req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });


    app.get('/api/:clientid/clientadplans/:planid/attachvideo/:resourceid', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await attachVideo(req.params.clientid, req.params.planid, req.params.resourceid);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/:clientid/clientadplans/:planid/attachimages', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await attachImages(req.params.clientid, req.params.planid, req.body.images);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/:clientid/clientadplans/:planid/updatepayment', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await updatePlanPayment(req.params.clientid, req.params.planid, req.body.payment);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};