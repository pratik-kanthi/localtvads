const { fetchAdsByChannels } = require.main.require('./services/AggregationService');

module.exports = (app) => {
    app.get('/api/dashboard/adsbychannel', async (req, res) => {
        try {
            const result = await fetchAdsByChannels();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};