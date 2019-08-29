const multer = require('multer');
const passport = require('passport');

const {saveClientAdPlan, renewClientAdPlan, getClientAd} = require.main.require('./services/ClientService');
const {saveCustomAd, previewCustomAd} = require.main.require('./services/FFMPEGService');


const upload = multer({
    dest: 'public/'
});

const multiType = upload.array('files');

module.exports = (app) => {

    app.post('/api/clientad/new', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await saveClientAdPlan(req.body.clientadplan, req.body.channelplan, req.body.addons, req.body.card);
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

    app.post('/api/clientad/upload', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await uploadClientAd(req.body.clientadplan, req.body.card);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/clientad/ffmpeg/save', passport.authenticate('jwt', {session: false}), multiType, async (req, res) => {
        try {
            let result = await saveCustomAd(req.body.clientAd);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/clientad/ffmpeg/preview', passport.authenticate('jwt', {session: false}), multiType, async (req, res) => {
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
};