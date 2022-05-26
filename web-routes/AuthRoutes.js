const {
    socialLogin,
    standardLogin,
    socialRegister,
    standardRegister,
} = require('../services/AuthService');


module.exports = (app) => {

    app.post('/api/auth/clientlogin', async (req, res, next) => {
        try {
            const result = await standardLogin(req.body.email, req.body.password, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/auth/clientsociallogin', async (req, res, next) => {
        try {
            const result = await socialLogin(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/auth/clientregister', async (req, res, next) => {
        try {
            const result = await standardRegister(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/auth/clientsocialregister', async (req, res, next) => {
        try {
            const result = await socialRegister(req.body, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};
