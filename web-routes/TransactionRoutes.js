const passport = require('passport');
const {
    getTransactions,
    generateTransactionReceipt
} = require.main.require('./services/ClientService');


module.exports = (app) => {
    app.get('/api/:clientid/transactions', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await getTransactions(req.query.client, req.query.plan, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/:clientid/transaction', passport.authenticate('website-bearer', {
        session: false
    }), async (req, res) => {
        try {
            const result = await generateTransactionReceipt(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};