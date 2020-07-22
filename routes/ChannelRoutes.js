const { createChannel, getProductsOfChannel, getChannels, getChannel, getPlansByChannel, getSecondsByChannel, getChannelScheduleAvailability, updateChannel, getLowestPriceOnChannel, getChannelPlan } = require.main.require('./services/ChannelService');

module.exports = (app) => {
    app.get('/api/channel/all', async (req, res) => {
        try {
            const result = await getChannels();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/channel/seconds', async (req, res) => {
        try {
            const result = await getSecondsByChannel(req.query.channel);
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

    app.get('/api/channel/plan', async (req, res) => {
        try {
            const result = await getChannelPlan(req.query.channel);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/channel/plans', async (req, res) => {
        try {
            const result = await getPlansByChannel(req.query.channel, req.query.seconds, req.query.startdate, req.query.enddate);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/channel/availability', async (req, res) => {
        try {
            const result = await getChannelScheduleAvailability(req.query.channel, req.query.seconds, req.query.startdate, req.query.enddate);
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
    app.get('/api/channelproducts/all', async (req, res) => {
        try {
            const result = await getProductsOfChannel(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.stats(ex.code || 500).send(ex.error);
        }
    });

    app.put('/api/channel/:id', async (req, res) => {
        try {
            const result = await updateChannel(req.params.id, req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.stats(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/channel', async (req, res) => {
        try {
            const result = await createChannel(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.stats(ex.code || 500).send(ex.error);
        }
    });
};
