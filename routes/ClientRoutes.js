const passport = require('passport');

const {addCard, getSavedCards} = require.main.require('./services/ClientService');

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
};