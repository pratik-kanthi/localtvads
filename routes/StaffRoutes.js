const {
    getAllAds,
    getAd,
    getAllClients,
    getClient,
    addStaff,
    getAllStaff
} = require.main.require('./services/StaffService');

module.exports = (app) => {
    app.get('/api/staff/ads', async (req, res, next) => {
        try {
            const result = await getAllAds(req.query.page, req.query.size, req.query.sortBy);
            return res.status(result.code).send(result.data);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/staff/ad/:id', async (req, res, next) => {
        try {
            const result = await getAd(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/staff/getclients', async (req, res, next) => {
        try {
            const result = await getAllClients();
            return res.status(result.code).send(result.data);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/staff/getclient/:clientid', async (req, res, next) => {
        try {
            const result = await getClient(req.params.clientid);
            return res.status(result.code).send(result.data);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/staff/add', async (req, res, next) => {
        try {
            const result = await addStaff(req.body);
            return res.status(result.code).send(result.data);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/staff/all', async (req, res, next) => {
        try {
            const result = await getAllStaff(req.body);
            return res.status(result.code).send(result.data);
        } catch (err) {
            next(err);
        }
    });
};