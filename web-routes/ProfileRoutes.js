const passport = require('passport');
const {
    getSavedCards
} = require.main.require('./services/ClientService');

const {
    updateProfile,
    updatePassword
} = require.main.require('./services/UserService');


module.exports = (app) => {

    app.get('/api/:clientid/cards', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await getSavedCards(req.query.client);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });


    app.put('/api/:clientid/profile', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const r = req.body;
            const result = await updateProfile(r.UserId, r.Title, r.Email, r.Phone, r.CurrentPassword, r.NewPassword);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.put('/api/:clientid/password', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await updatePassword(req.body.userId, req.body.currentPassword, req.body.newPassword);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

};