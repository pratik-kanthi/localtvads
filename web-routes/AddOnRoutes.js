const {
    getActiveAddOns
} = require.main.require('./services/AddOnService');


module.exports = (app) => {
    app.get('/api/serviceaddons/all', async (req, res) => {
        try {
            const result = await getActiveAddOns();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};