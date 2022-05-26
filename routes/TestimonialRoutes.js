const passport = require('passport');
const {
    saveTestimonial,
    deleteTestimonial,
    getTestimonials
} = require.main.require('./services/TestimonialService');

module.exports = (app) => {

    app.get('/api/testimonials/all', async (req, res, next) => {
        try {
            const result = await getTestimonials(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/testimonials', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await saveTestimonial(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });


    app.delete('/api/testimonials', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await deleteTestimonial(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};
