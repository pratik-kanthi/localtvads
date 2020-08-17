const passport = require('passport');
const {
    createChannelProduct,
    deleteChannelProduct
} = require.main.require('./services/ChannelProductService');

module.exports = (app) => {
    app.post('/api/channelproducts', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await createChannelProduct(req.body);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

    app.delete('/api/channelproducts', passport.authenticate('jwt', {
        session: false
    }), async (req, res) => {
        try {
            const result = await deleteChannelProduct(req.query.productId);
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });
};