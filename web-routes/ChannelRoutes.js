const {
    getChannels,
    getChannel,
    getLowestPriceOnChannel,
} = require('../services/ChannelService');

module.exports = (app) => {

    app.get('/api/channel/all', async (req, res, next) => {
        try {
            const result = await getChannels();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.get('/api/channel/lowestprice', async (req, res, next) => {
        try {
            const result = await getLowestPriceOnChannel(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.get('/api/channel/:id', async (req, res, next) => {
        try {
            const result = await getChannel(req.params.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};
