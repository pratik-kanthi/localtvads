const { fetchChannelPlans, saveChannelPlan, updateChannelPlan, deleteChannelPlan } = require.main.require('./services/ChannelPlanService');

module.exports = (app) => {
    app.get('/api/channelplan/all', async (req, res) => {
        try {
            const result = await fetchChannelPlans(req.query.channel);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/channelplan', async (req, res) => {
        try {
            const result = await saveChannelPlan(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.put('/api/channelplan', async (req, res) => {
        try {
            const result = await updateChannelPlan(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.delete('/api/channelplan', async (req, res) => {
        try {
            const result = await deleteChannelPlan(req.query.channelplanid);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};
