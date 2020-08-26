const {
    getProductsOfChannel
} = require.main.require('./services/ChannelService');

module.exports = (app) => {

    app.get('/api/channelproducts/all', async (req, res) => {
        try {
            const result = await getProductsOfChannel(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.stats(ex.code || 500).send(ex.error);
        }
    });

};