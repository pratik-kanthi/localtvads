
const passport = require('passport');
const { fetchEnquiries, fetchEnquiry, deleteEnquiry, fetchEnquiryByPage } = require.main.require('./services/EnquiryService');

module.exports = (app) => {
    app.get('/api/enquiries/all', async (req, res) => {
        try {
            const result = await fetchEnquiries();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/enquiry/:id', async (req, res) => {
        try {
            const result = await fetchEnquiry(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.delete('/api/enquiry/:id', async (req, res) => {
        try {
            const result = await deleteEnquiry(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/enquiries/byPage', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await fetchEnquiryByPage(parseInt(req.query.page), parseInt(req.query.size), req.query.sortBy);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};