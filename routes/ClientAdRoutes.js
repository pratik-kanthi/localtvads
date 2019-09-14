const multer = require('multer');
const passport = require('passport');
const config = require.main.require('./config');

const {addCard} = require.main.require('./services/ClientService');
const {saveClientAdPlan, renewClientAdPlan, getClientAd, uploadClientAd, getClientAdPlan} = require.main.require('./services/ClientAdService');
const {saveCustomAd, previewCustomAd} = require.main.require('./services/FFMPEGService');

let mediaUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, callback) => {
        if (!file) {
            return callback(null, true);
        }
        let ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
        if (config.media.video.allowedExtensions.indexOf(ext) === -1) {
            return callback(
                {
                    message: utilities.ErrorMessages.UNSUPPORTED_MEDIA_TYPE
                },
                null
            );
        }
        callback(null, true);
    },
    limits: {
        fileSize: config.media.video.maxSize
    }
});

let mediaType = mediaUpload.single('file');

module.exports = (app, io) => {

    app.post('/api/clientad/new', passport.authenticate('jwt', {session: false}), async (req, res) => {
        let card;
        if (req.body.save && !req.body.cardid) {
            try {
                card = await addCard(req.body.client, req.body.token);
            } catch (err) {
                return res.status(err.code).send(err.error);
            }
        }
        try {
            let result = await saveClientAdPlan(req.body.clientadplan, req.body.channelplan, req.body.addons, req.body.cardid || card.data._id,  req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/clientad/renew', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await renewClientAdPlan(req.body.clientadplan, req.body.card);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/clientad/upload', passport.authenticate('jwt', {session: false}), mediaType, async (req, res) => {
        mediaType(req, res, async (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            try {
                let result = await uploadClientAd(req.body.clientadplan);
                return res.status(result.code).send(result.data);
            } catch (ex) {
                return res.status(ex.code || 500).send(ex.error);
            }
        });
    });

    app.post('/api/clientad/ffmpeg/save', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await saveCustomAd(req.body.clientAd);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/clientad/ffmpeg/preview', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await previewCustomAd(req.body.pictures, req.body.audio, req.body.clientAd);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/clientad/getone', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await getClientAd(req.query.clientad);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/clientad/getclientadplan', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await getClientAdPlan(req.query.clientadplan);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};