const passport = require('passport');
const { getAllAds, getAd, approveAd, rejectAd, getAllClients, getClient, addStaff, getAllStaff, fetchStaffsByPage } = require.main.require('./services/StaffService');


module.exports = (app) => {

    app.get('/api/staff/ads', async (req, res) => {
        try {
            const result = await getAllAds();
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });


    app.get('/api/staff/ad/:id', async (req, res) => {
        try {
            const result = await getAd(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });


    app.get('/api/staff/getclients', async (req, res) => {
        try {
            const result = await getAllClients();
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });


    app.get('/api/staff/getclient/:clientid', async (req, res) => {
        try {
            const result = await getClient(req.params.clientid);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });


    app.post('/api/staff/add', async (req, res) => {
        try {
            const result = await addStaff(req.body);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });


    app.get('/api/staff/all', async (req, res) => {
        try {
            const result = await getAllStaff(req.body);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });


    // Approve ad
    app.post('/api/staff/ad/approve/:id', async (req, res) => {
        try {
            const result = await approveAd(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });

    // Reject
    app.post('/api/staff/ad/reject/:id', async (req, res) => {
        try {
            const result = await rejectAd(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });

    app.get('/api/staffs/byPage', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await fetchStaffsByPage(parseInt(req.query.page), parseInt(req.query.size), req.query.sortBy);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};