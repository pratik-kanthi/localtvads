const {
    fetchChannelPlans
} = require.main.require('./services/ChannelPlanService');

module.exports = (app) => {
    app.get('/api/channelplan/all', async (req, res) => {
        try {
            const result = await fetchChannelPlans();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};