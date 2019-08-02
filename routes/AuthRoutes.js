const {socialAuth, auth} = require.main.require('./services/AuthService');

module.exports = (app) => {
    app.post('/api/socialauth', async (req, res) => {
        try {
            let result = await socialAuth(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });

    app.post('/api/auth', async (req, res) => {
        try {
            let result = await auth(req.body);
            return res.status(result.code).send(result.error);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });
};