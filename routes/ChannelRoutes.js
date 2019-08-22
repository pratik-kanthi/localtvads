const {getChannels, getChannelPlans} = require.main.require('./services/ChannelService');

module.exports = (app) => {

    app.post('/api/channel/nearbychannels', async (req, res) => {
        try {
            let result = await getChannels(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/channel/plans', async (req, res) => {
        try {
            let result = await getChannelPlans(req.query.channel);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};