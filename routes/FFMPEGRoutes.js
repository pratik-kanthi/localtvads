const {saveCustomVideo, previewCustomVideo} = require.main.require('./services/FFMPEGService');
const multer = require('multer');
const passport = require('passport');

const upload = multer({
    dest: 'public/'
});

const multiType = upload.array('files');

module.exports = (app) => {
    app.post('/api/ffmpeg/save', async (req, res) => {
        try {
            let result = await saveCustomVideo(req.body.clientAd);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/ffmpeg/preview', async (req, res) => {
        try {
            let result = await previewCustomVideo(req.body.pictures, req.body.audio, req.body.clientAd);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};