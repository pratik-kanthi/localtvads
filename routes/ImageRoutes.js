const multer = require('multer');
const imageService = require.main.require('./services/ImageService');

module.exports = (app) => {
    let upload = multer({
        storage: multer.memoryStorage()
    });

    let type = upload.single('file');

    /**
     * @api {post} /api/image Upload a picture
     * @apiVersion 1.0.0
     * @apiName Upload Image
     * @apiGroup Image
     *
     * @apiParam {String} owner Owner entity where Image needs to be updated.
     * @apiParam {String} ownerid Owner entity's _id.
     * @apiParam {String} attribute Attribute of the entity where Image's URL will be updated.
     *
     * @apiSuccess {Object} data Owner entity object.
     */
    app.post('/api/image', type, async (req, res) => {
        if (!req.query.owner || !req.query.ownerid || !req.query.attribute)
            return res.status(400).json({
                error: {
                    message: utilities.GeneralMessages.BAD_REQUEST
                }
            });
        try {
            let response = await imageService.uploadImage(req.file, req.query);
            res.status(response.code).json(response.data);
        } catch (err) {
            res.status(err.code).json(err.error);
        }
    });

    /**
     * @api {delete} /api/bucketfile Delete an image file
     * @apiVersion 1.0.0
     * @apiName Delete Image From Bucket
     * @apiGroup Image
     *
     * @apiParam {String} location URL of the image
     *
     * @apiSuccess {String} Deleted Acknowledgement of image deleted.
     */
    app.delete('/api/image/bucketfile', type, async (req, res) => {
        if (!req.query.location)
            return res.status(400).json({
                error: {
                    message: utilities.GeneralMessages.BAD_REQUEST
                }
            });
        try {
            let response = await imageService.removeBucketImage(req.query.location);
            res.status(response.code).json(response.data);
        } catch (err) {
            res.status(err.code).json(err.error);
        }
    });

    /**
     * @api {delete} /api/image Delete a image file and update owner entity
     * @apiVersion 1.0.0
     * @apiName Delete Image from an entity
     * @apiGroup Image
     *
     * @apiParam {String} owner Owner entity where Image needs to be deleted.
     * @apiParam {String} ownerid Owner entity's _id.
     * @apiParam {String} attribute Attribute of the entity where Image's URL will be updated.
     *
     * @apiSuccess {String} data Owner entity object.
     */
    app.delete('/api/image', type, async (req, res) => {
        if (!req.query.owner || !req.query.attribute || !req.query.ownerid)
            return res.status(400).json({
                error: {
                    message: utilities.GeneralMessages.BAD_REQUEST
                }
            });
        try {
            let response = await imageService.removeImage(req.query.attribute, req.query.owner, req.query.ownerid);
            res.status(response.code).json(response.data);
        } catch (err) {
            res.status(err.code).json(err.error);
        }
    });
};