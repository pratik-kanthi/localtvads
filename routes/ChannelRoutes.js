const passport = require('passport');
const multer = require('multer');
const {
    createChannel,
    updateChannel,
    getChannelsInfo,
    uploadLogo
} = require.main.require('./services/ChannelService');


module.exports = (app) => {
    const upload = multer({
        storage: multer.memoryStorage()
    });

    const mediaType = upload.single('file');

    app.get('/api/channelsinfo', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await getChannelsInfo();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.put('/api/channel/:id', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await updateChannel(req.params.id, req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.stats(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/channels', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await createChannel(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.stats(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/channel/logo', mediaType, passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await uploadLogo(req.query.id, req.file);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.stats(ex.code || 500).send(ex.error);
        }
    });
};