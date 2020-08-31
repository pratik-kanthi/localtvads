const {
    getClient,
    addStaff,
} = require.main.require('./services/StaffService');

module.exports = (app) => {


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

};