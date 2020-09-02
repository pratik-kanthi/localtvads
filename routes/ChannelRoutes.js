const passport = require('passport');
const multer = require('multer');
const {
    createChannel,
    getChannelsWithMetrics,
    uploadLogo
} = require.main.require('./services/ChannelService');


module.exports = (app) => {
    const upload = multer({
        storage: multer.memoryStorage()
    });

    const mediaType = upload.single('file');

    app.get('/api/channelsinfo', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await getChannelsWithMetrics();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/channels', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await createChannel(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/channel/logo', mediaType, passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await uploadLogo(req.query.id, req.file);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};