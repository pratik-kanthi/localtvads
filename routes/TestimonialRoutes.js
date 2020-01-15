const passport = require('passport');
const { getTestimonials, saveTestimonial, deleteTestimonial } = require.main.require('./services/TestimonialService');

module.exports = (app) => {
    app.get('/api/testimonials/all', async (req, res) => {
        try {
            const result = await getTestimonials();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
    app.post('/api/testimonials', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await saveTestimonial(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
    app.delete('/api/testimonials', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            const result = await deleteTestimonial(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};