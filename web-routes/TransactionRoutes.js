const passport = require('passport');
const {
    getTransactions,
    generateTransactionReceipt
} = require.main.require('./services/ClientService');


module.exports = (app) => {
    app.get('/api/:clientid/transactions', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await getTransactions(req.query.client, req.query.plan);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

    app.get('/api/:clientid/transaction', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res, next) => {
        try {
            const result = await generateTransactionReceipt(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

};