const { getAdSchedules } = require.main.require('./services/AdScheduleService');

module.exports = (app) => {

    app.get('/api/adschedule/all', async (req, res) => {
        try {
            const result = await getAdSchedules();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });


};