const {
    socialLogin,
    standardLogin,
    socialRegister,
    standardRegister,
    verifyUserEmail,
    sendPasswordResetLink,
    resetPassword
} = require.main.require('./services/AuthService');

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

    app.get('/api/auth/confirmation/:userid', async (req, res) => {
        try {
            let result = await verifyUserEmail(req.params.userid);
            return res.status(result.code).redirect(process.env.WEBAPP + '?emailconfirmed=true');
        } catch (ex) {
            ex
            return res.status(ex.code).send(ex.error);
        }
    })

    app.get('/api/auth/forgotpassword/:email', async (req, res) => {
        try {
            let result = await sendPasswordResetLink(req.params.email);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            ex;
            return res.status(ex.code).send(ex.error);
        }
    });


    app.post('/api/auth/resetpassword/:hash', async (req, res) => {
        try {
            let result = await resetPassword(req.params.hash, req.body.password);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code).send(ex.error);
        }

    })
};