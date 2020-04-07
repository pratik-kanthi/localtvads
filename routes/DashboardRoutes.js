const {
    fetchDashboardAds,
    fetchInsights,
    fetchAdsByChannels
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


    app.get('/api/dashboard/insights/:startdate/:enddate', async (req, res) => {
        try {
            const result = await fetchInsights(req.params.startdate, req.params.enddate);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/dashboard/adsbychannel', async (req, res) => {
        try {
            const result = await fetchAdsByChannels();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};