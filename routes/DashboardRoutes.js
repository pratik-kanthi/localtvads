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


    app.get('/api/dashboard/count', async (req, res) => {
        try {
            const result = await fetchMetricsByDate();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};