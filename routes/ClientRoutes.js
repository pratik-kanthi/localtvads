const passport = require('passport');

const {addCard, deleteCard, getSavedCards, setPreferredCard} = require.main.require('./services/ClientService');

module.exports = (app) => {
    app.post('/api/client/addcard', passport.authenticate('jwt', {session: false}), async(req,res) => {
       try {
           let result = await addCard(req.body.client, req.body.token);
           return res.status(result.code).send(result.data)
       } catch (err) {
           return res.status(err.code).send(err.error);
       }
    });

    app.get('/api/client/cards', passport.authenticate('jwt', {session: false}), async(req,res) => {
        try {
            let result = await getSavedCards(req.query.client);
            return res.status(result.code).send(result.data)
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });

    app.post('/api/client/preferredcard', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await setPreferredCard(req.body.client, req.body.card);
            return res.status(result.code).send(result.data)
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });

    app.delete('/api/client/deletecard', passport.authenticate('jwt', {session: false}), async (req, res) => {
        try {
            let result = await deleteCard(req.query.client, req.query.card);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};