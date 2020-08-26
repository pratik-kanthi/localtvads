const passport = require('passport');
const {
    fetchEnquiries,
    fetchEnquiry,
    deleteEnquiry,
    fetchEnquiryByPage
} = require.main.require('./services/EnquiryService');

module.exports = (app) => {

    app.get('/api/enquiries/all', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await fetchEnquiries();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.get('/api/enquiry/:id', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await fetchEnquiry(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.delete('/api/enquiry/:id', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await deleteEnquiry(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.get('/api/enquiries/byPage', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await fetchEnquiryByPage(parseInt(req.query.page), parseInt(req.query.size), req.query.sortBy);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

};