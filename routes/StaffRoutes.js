const {
    getAllAds,
    getAd,
    approveAd,
    rejectAd,
    getAllClients,
    getClient,
    addStaff,
    getAllStaff
} = require.main.require('./services/StaffService');


module.exports = (app) => {

    app.get('/api/staff/ads', async (req, res) => {
        try {
            const result = await getAllAds(req.query.page, req.query.size);
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
};