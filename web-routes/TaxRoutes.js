const {
    getAllTaxes
} = require.main.require('./services/TaxService');

module.exports = (app) => {


    app.get('/api/taxes/all', async (req, res) => {
        try {
            const result = await getAllTaxes();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            return res.status(ex.code || 500).send(ex.error);
        }
    });

};