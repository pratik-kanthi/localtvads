const passport = require('passport');
const { addFAQ } = require.main.require('./services/FAQService');

module.exports = (app) => {
    app.post('/api/faqs', passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const result = await addFAQ(req.body, req.user);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};
