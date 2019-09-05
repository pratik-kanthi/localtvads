const {getChannels, getPlansByChannel, getNearByChannelPlans, getSecondsByChannel} = require.main.require('./services/ChannelService');

module.exports = (app) => {

    app.get('/api/channel/all', async (req, res) => {
        try {
            let result = await getChannels();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/channel/seconds', async (req, res) => {
       try {
           let result = await getSecondsByChannel(req.query.channel);
           return res.status(result.code).send(result.data);
       } catch (ex) {
           return res.status(ex.code || 500).send(ex.error);
       }
    });

    app.get('/api/channel/plans', async (req, res) => {
        try {
            let result = await getPlansByChannel(req.query.channel, req.query.seconds);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/channel/nearbychannelplans', async (req, res) => {
        try {
            let result = await getNearByChannelPlans(req.query.channel, req.query.seconds);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};