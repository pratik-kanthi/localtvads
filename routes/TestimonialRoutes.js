const passport = require('passport');
const { saveTestimonial } = require.main.require('./services/TestimonialService');

module.exports = (app) => {
    app.post('/api/testimonials', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await saveTestimonial(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};