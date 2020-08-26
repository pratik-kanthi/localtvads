const {
    getChannels,
    getChannel,
    getLowestPriceOnChannel,
} = require.main.require('./services/ChannelService');

module.exports = (app) => {

    app.get('/api/channel/all', async (req, res) => {
        try {
            const result = await getChannels();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/channel/lowestprice', async (req, res) => {
        try {
            const result = await getLowestPriceOnChannel(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/channel/:id', async (req, res) => {
        try {
            const result = await getChannel(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.stats(ex.code || 500).send(ex.error);
        }
    });
};