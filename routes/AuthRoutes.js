const passport = require('passport');
const {
    portalLogin,
    verifyUserEmail,
    sendPasswordResetLink,
    resetPassword,
    changePassword,
    sendVerificationEmail
} = require.main.require('./services/AuthService');

module.exports = (app) => {

    app.post('/api/auth/login', async (req, res, next) => {
        try {
            const result = await portalLogin(req.body.email, req.body.password, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });


    app.get('/api/auth/confirmation/:userid', async (req, res, next) => {
        try {
            const result = await verifyUserEmail(req.params.userid);
            return res.status(result.code).redirect(process.env.WEBAPP + '?emailconfirmed=true');
        } catch (ex) {
            next(ex);
        }
    });

    app.get('/api/auth/forgotpassword/:email', async (req, res, next) => {
        try {
            const result = await sendPasswordResetLink(req.params.email);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/auth/resetpassword/:hash', async (req, res, next) => {
        try {
            const result = await resetPassword(req.params.hash, req.body.password);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.put('/api/auth/changepassword', passport.authenticate('jwt', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await changePassword(req.body.password, req.user);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.post('/api/auth/sendverification', async (req, res, next) => {
        try {
            const result = await sendVerificationEmail(req.body.email, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });
};