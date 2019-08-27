const multer = require('multer');
const passport = require('passport');

const config = require.main.require('./config');

const {addImageResource, updateImageResource, deleteImageResource, addMediaResource, updateMediaResource, deleteMediaResource, getAllMediaResources} = require.main.require('./services/ResourceService');

let imageUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, callback) => {
        if (!file) {
            return callback(null, true);
        }
        let ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
        if (config.media.image.allowedExtensions.indexOf(ext) !== -1) {
            file.fileType = 'IMAGE';
        } else {
            return callback({
                message: utilities.ErrorMessages.UNSUPPORTED_MEDIA_TYPE
            }, null);
        }
        callback(null, true);
    },
    limits: {
        fileSize: config.media.image.maxSize
    }
});

let mediaUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, callback) => {
        if (!file) {
            return callback(null, true);
        }
        let ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
        if (config.media.audio.allowedExtensions.indexOf(ext) !== -1) {
            file.fileType = 'AUDIO';
        } else if (config.media.video.allowedExtensions.indexOf(ext) !== -1) {
            file.fileType = 'VIDEO';
        } else {
            return callback({
                message: utilities.ErrorMessages.UNSUPPORTED_MEDIA_TYPE
            }, null);
        }
        callback(null, true);
    },
    limits: {
        fileSize: config.media.maxSize
    }
});

let imageType = imageUpload.single('file');
let mediaType = mediaUpload.single('file');

module.exports = (app) => {
    app.post('/api/clientresource/image', passport.authenticate('jwt', {session: false}), (req, res) => {
        imageType(req, res, async (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            try {
                let result = await addImageResource(req.body.document, req.file);
                return res.status(result.code).send(result.data);
            } catch (ex) {
                return res.status(ex.code || 500).send(ex.error);
            }
        });
    });

    app.put('/api/clientresource/image', passport.authenticate('jwt', {session: false}), (req, res) => {
        imageType(req, res, async (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            try {
                let result = await updateImageResource(req.body, req.file);
                return res.status(result.code).send(result.data);
            } catch (ex) {
                return res.status(ex.code || 500).send(ex.error);
            }
        });
    });

    app.delete('/api/clientresource/image', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await deleteImageResource(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/clientresource/media', passport.authenticate('jwt', {session: false}), (req, res) => {
        mediaType(req, res, async (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            try {
                let result = await addMediaResource(req.body.media, req.file);
                return res.status(result.code).send(result.data);
            } catch (ex) {
                return res.status(ex.code).send(ex.error);
            }
        });
    });

    app.put('/api/clientresource/media', passport.authenticate('jwt', {session: false}), mediaType, (req, res) => {
        mediaType(req, res, async (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            try {
                let result = await updateMediaResource(req.body.media, req.file);
                return res.status(result.code).send(result.data);
            } catch (ex) {
                return res.status(ex.code).send(ex.error);
            }
        });
    });

    app.delete('/api/clientresource/media', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await deleteMediaResource(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });

    app.get('/api/clientresource/all', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await getAllMediaResources(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });
};