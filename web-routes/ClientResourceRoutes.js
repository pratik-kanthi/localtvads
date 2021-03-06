const passport = require('passport');
const multer = require('multer');
const config = require('../config');
const {
    addImageResource,
    getAllResources,
    removeAddOnResource,
    addDocumentResource,
    getClientStorage
} = require('../services/ResourceService');


module.exports = (app) => {

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

    const _fileUpload = multer({
        storage: multer.memoryStorage(),

    });

    const fileType = _fileUpload.single('file');
    const imageType = _imageUpload.single('file');



    app.get('/api/:clientid/clientresources', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await getAllResources(req.params.clientid);
            return res.status(result.code).json(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/:clientid/clientresource/image', passport.authenticate('website-bearer', {
        session: false
    }), (req, res, next) => {
        imageType(req, res, async (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            try {
                const result = await addImageResource(req.body.document, req.file);
                return res.status(result.code).json(result.data);
            } catch (ex) {
                next(ex);
            }
        });
    });

    app.post('/api/:clientid/clientresource/document', fileType, passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {

        if (!req.body.document) {
            return res.status(400).json({
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        try {
            const result = await addDocumentResource(req.body.document, req.file);
            return res.status(result.code).json(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.delete('/api/:clientid/addonresources', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await removeAddOnResource(req.query.planId, req.query.id);
            return res.status(result.code).json(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.get('/api/:clientid/storage', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await getClientStorage(req.params.clientid);
            return res.status(result.code || 200).json(result.data);
        } catch (ex) {
            next(ex);
        }
    });


};
