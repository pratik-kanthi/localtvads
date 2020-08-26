const {
    subscribeUser,
    submitEnquiry
} = require.main.require('./services/ContactService');

const {
    getTestimonials
} = require.main.require('./services/TestimonialService');

module.exports = (app) => {

    app.post('/api/contact/subscribe', async (req, res, next) => {
        try {
            const result = await subscribeUser(req.body.subscriberEmail, req.ip);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/contact/enquiry', async (req, res, next) => {
        try {
            const result = await submitEnquiry(req.body.Name, req.body.Email, req.body.Subject, req.body.Message);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });


    app.get('/api/testimonials/all', async (req, res, next) => {
        try {
            const result = await getTestimonials();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};