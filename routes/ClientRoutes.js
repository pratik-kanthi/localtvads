const passport = require('passport');
const { addCard, deleteCard, getSavedCards, setPreferredCard, getTransactions, fetchClientsByPage } = require.main.require('./services/ClientService');
const { updateProfile } = require.main.require('./services/UserService');
const { generateTransactionReceipt } = require.main.require('./services/ReceiptService');

module.exports = (app) => {
    app.post('/api/client/addcard', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await addCard(req.body.client, req.body.token);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });

    app.get('/api/client/cards', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await getSavedCards(req.query.client);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });

    app.delete('/api/client/deletecard', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await deleteCard(req.query.client, req.query.card);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.post('/api/client/preferredcard', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await setPreferredCard(req.body.client, req.body.card);
            return res.status(result.code).send(result.data);
        } catch (err) {
            return res.status(err.code).send(err.error);
        }
    });

    app.put('/api/client/profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const r = req.body;
            const result = await updateProfile(r.UserId, r.Title, r.Email, r.Phone, r.CurrentPassword, r.NewPassword);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/client/transactions', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await getTransactions(req.query.client, req.query.plan, req);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/client/transaction', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await generateTransactionReceipt(req.query.id);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.get('/api/clients/byPage', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await fetchClientsByPage(parseInt(req.query.page), parseInt(req.query.size), req.query.sortBy);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};
