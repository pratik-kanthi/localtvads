const passport = require('passport');
const {
    saveClientAdPlan,
    getClientAdPlans,
    getClientAdPlan,
    attachVideo,
    attachImages,
    updateClientAdPlan,
    updatePlanPayment,
    authenticateCardPayment
} = require('../services/ClientAdPlanService');

module.exports = (app) => {
    app.post('/api/:clientid/createplan', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await saveClientAdPlan(req.body.clientAdPlan, req.body.newCard, req.body.savedCard);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/:clientid/authenticatecard', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await authenticateCardPayment(req.body.paymentIntent, req.body.clientadplan, req.body.authStatus);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.get('/api/:clientid/clientadplans', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await getClientAdPlans(req.params.clientid);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });


    app.get('/api/:clientid/clientadplans/:planid', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await getClientAdPlan(req.params.clientid, req.params.planid);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/:clientid/clientadplans/:planid', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await updateClientAdPlan(req.params.planid, req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });


    app.get('/api/:clientid/clientadplans/:planid/attachvideo/:resourceid', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await attachVideo(req.params.clientid, req.params.planid, req.params.resourceid);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/:clientid/clientadplans/:planid/attachimages', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await attachImages(req.params.clientid, req.params.planid, req.body.images);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/:clientid/clientadplans/:planid/updatepayment', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await updatePlanPayment(req.params.clientid, req.params.planid, req.body.payment);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

};
