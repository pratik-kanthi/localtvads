const {socialLogin, standardLogin, socialRegister, standardRegister} = require.main.require('./services/AuthService');

module.exports = (app) => {

    app.post('/api/auth/clientlogin', async (req, res) => {
        try {
            let result = await standardLogin(req.body.email, req.body.password, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });

    app.post('/api/auth/clientsociallogin', async (req, res) => {
        try {
            let result = await socialLogin(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });

    app.post('/api/auth/clientregister', async (req, res) => {
        try {
            let result = await standardRegister(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });

    app.post('/api/auth/clientsocialregister', async (req, res) => {
        try {
            let result = await socialRegister(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }
    });
};