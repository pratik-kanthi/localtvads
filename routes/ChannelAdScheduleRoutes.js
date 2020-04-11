const { saveChannelAdSchedule } = require.main.require('./services/ChannelAdScheduleService');

module.exports = (app) => {
    app.post('/api/channeladschedule', async (req, res) => {
        try {
            const result = await saveChannelAdSchedule(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};
