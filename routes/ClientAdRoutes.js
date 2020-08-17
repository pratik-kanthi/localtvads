const multer = require('multer');
const passport = require('passport');
const config = require.main.require('./config');
const {
    addCard
} = require.main.require('./services/ClientService');
const {
    checkCouponApplicable,
    getApplicableCoupons,
    getClientAd,
    getClientAdPlan,
    renewClientAdPlan,
    saveClientAdPlan,
    uploadClientAd,
    getAllClientAdPlans
} = require.main.require('./services/ClientAdPlanService');

const mediaUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, callback) => {
        if (!file) {
            return callback(null, true);
        }
        const ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
        if (config.media.video.allowedExtensions.indexOf(ext) === -1) {
            return callback({
                message: utilities.ErrorMessages.UNSUPPORTED_MEDIA_TYPE,
            },
            null
            );
        }
        callback(null, true);
    },
    limits: {
        fileSize: config.media.video.maxSize,
    },
});

const mediaType = mediaUpload.single('file');

module.exports = (app) => {
    app.post('/api/clientad/new', passport.authenticate('jwt', {
        session: false,
    }), async (req, res) => {
        try {
            let card = null;
            if (req.body.token) {
                card = await addCard(req.body.clientAdPlan.Client, req.body.token);
            }
            try {
                const result = await saveClientAdPlan(req.body.clientAdPlan, req.body.cardId, card ? card.data : null, req.user);
                return res.status(result.code).send(result.data);
            } catch (ex) {
                return res.status(ex.code || 500).send(ex.error);
            }
        } catch (ex) {
            return res.status(500).send(ex);
        }
    });

    app.post('/api/clientad/renew', passport.authenticate('jwt', {
        session: false,
    }), async (req, res) => {
        try {
            const result = await renewClientAdPlan(req.body.clientadplan, req.body.card);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/clientad/upload', passport.authenticate('jwt', {
        session: false,
    }), mediaType, (req, res) => {
        mediaType(req, res, async (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            try {
                const result = await uploadClientAd(req.body.clientadplan);
                return res.status(result.code).send(result.data);
            } catch (ex) {
                return res.status(ex.code || 500).send(ex.error);
            }
        });
    });

    app.get('/api/clientad/getall', passport.authenticate('jwt', {
        session: false,
    }), async (req, res) => {
        try {
            const result = await getAllClientAdPlans(req.query.page, req.query.top, req.query.sort, req.query.Status, req.query.Channel);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/clientad/getone', passport.authenticate('jwt', {
        session: false,
    }), async (req, res) => {
        try {
            const result = await getClientAd(req.query.clientad);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/clientad/getclientadplan', passport.authenticate('jwt', {
        session: false,
    }), async (req, res) => {
        try {
            const result = await getClientAdPlan(req.query.clientadplan);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/clientad/couponexists', passport.authenticate('jwt', {
        session: false,
    }), async (req, res) => {
        try {
            const result = await checkCouponApplicable(req.query.clientid, req.query.channel, req.query.adschedule, req.query.startdate, req.query.couponcode);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/clientad/coupons', passport.authenticate('jwt', {
        session: false,
    }), async (req, res) => {
        try {
            const result = await getApplicableCoupons(req.query.clientid, req.query.channel, req.query.adschedule, req.query.startdate);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};