const passport = require('passport');
const {
    addCard,
    deleteCard,
    getSavedCards,
    setPreferredCard,
} = require.main.require('./services/ClientService');

const {
    updateProfile
} = require.main.require('./services/UserService');


module.exports = (app) => {

    app.get('/api/:clientid/cards', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await getSavedCards(req.query.client);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });

    app.post('/api/:clientid/addcard', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await addCard(req.body.client, req.body.token);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });


    app.delete('/api/:clientid/deletecard', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await deleteCard(req.query.client, req.query.card);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/:clientid/preferredcard', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await setPreferredCard(req.body.client, req.body.card);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });

    app.put('/api/:clientid/profile', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const r = req.body;
            const result = await updateProfile(r.UserId, r.Title, r.Email, r.Phone, r.CurrentPassword, r.NewPassword);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};