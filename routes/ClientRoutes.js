const passport = require('passport');

const {addCard} = require.main.require('./services/ClientService');

module.exports = (app) => {
    app.post('/api/client/addcard', passport.authenticate('jwt', {session: false}), async(req,res) => {
       try {
           let result = await addCard(req.body.client, req.body.token);
           return res.status(result.code).send(result.data)
       } catch (err) {
           return res.status(err.code).send(err.error);
       }
    });
};