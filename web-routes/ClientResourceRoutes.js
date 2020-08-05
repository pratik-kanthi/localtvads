const passport = require('passport');
const multer = require('multer');
const config = require.main.require('./config');
const {
    addImageResource,
    getAllResources,
    removeAddOnResource,
    addDocumentResource
} = require.main.require('./services/ResourceService');

const _imageUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, callback) => {
        if (!file) {
            return callback(null, true);
        }
        const ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
        if (config.media.image.allowedExtensions.indexOf(ext.toLowerCase()) !== -1) {
            file.fileType = 'IMAGE';
        } else {
            return callback({
                message: utilities.ErrorMessages.UNSUPPORTED_MEDIA_TYPE,
            },
            null
            );
        }
        callback(null, true);
    },
    limits: {
        fileSize: config.media.image.maxSize,
    },
});

const imageType = _imageUpload.single('file');
module.exports = (app) => {
    app.get('/api/:clientid/clientresources', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await getAllResources(req.params.clientid);
            return res.status(result.code).json(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/:clientid/clientresource/image', passport.authenticate('website-bearer', {
        session: false
    }), (req, res) => {
        imageType(req, res, async (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            try {
                const result = await addImageResource(req.body.document, req.file);
                return res.status(result.code).json(result.data);
            } catch (ex) {
                return res.status(ex.code || 500).send(ex.error);
            }
        });
    });

    app.post('/api/:clientid/clientresource/document', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await addDocumentResource(req.body.document, req.file);
            return res.status(result.code).json(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.delete('/api/:clientid/addonresources', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await removeAddOnResource(req.query.planId, req.query.id);
            return res.status(result.code).json(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};