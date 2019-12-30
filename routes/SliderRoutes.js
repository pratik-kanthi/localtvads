const passport = require('passport');
const { saveSlider } = require.main.require('./services/SliderService');

module.exports = (app) => {
    app.post('/api/sliders', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await saveSlider(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};