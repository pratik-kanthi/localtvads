const {
    fetchDashboardAds,
    fetchMetricsByDate
} = require.main.require('./services/DashboardService');

module.exports = (app) => {
    app.get('/api/dashboard/ads', async (req, res) => {
        try {
            const result = await fetchDashboardAds();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/metrics/:modelname', async (req, res) => {
        try {
            const result = await fetchMetricsByDate(req.params.modelname);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};