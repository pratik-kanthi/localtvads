const {
    subscribeUser,
    submitEnquiry
} = require.main.require('./services/ContactService');

module.exports = (app) => {

    app.post('/api/contact/subscribe', async (req, res) => {
        try {
            const result = await subscribeUser(req.body.subscriberEmail, req.ip);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });

    app.post('/api/contact/enquiry', async (req, res) => {
        try {
            const result = await submitEnquiry(req.body.Name, req.body.Email, req.body.Subject, req.body.Message);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });
};