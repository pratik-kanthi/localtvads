const passport = require('passport');
const multer = require('multer');
const { getSliders, saveSlider, updateSlider, deleteSlider, updateOrders } = require.main.require('./services/SliderService');

module.exports = (app) => {
    const upload = multer({
        storage: multer.memoryStorage()
    });
    const type = upload.single('file');
    app.get('/api/sliders/all', async (req, res) => {
        try {
            const result = await getSliders();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
    app.post('/api/sliders', passport.authenticate('jwt', {session: false}), type, async (req, res) => {
        try {
            const result = await saveSlider(JSON.parse(req.body.data), req.file, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.put('/api/sliders', passport.authenticate('jwt', {session: false}), type, async (req, res) => {
        try {
            const result = await updateSlider(JSON.parse(req.body.data), req.file, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.delete('/api/sliders', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await deleteSlider(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });

    app.put('/api/sliders/updateorder', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await updateOrders(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};