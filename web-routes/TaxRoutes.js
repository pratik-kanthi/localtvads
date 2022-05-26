const {
    getAllTaxes
} = require('../services/TaxService');

module.exports = (app) => {


    app.get('/api/taxes/all', async (req, res, next) => {
        try {
            const result = await getAllTaxes();
            return res.status(result.code).send(result.data);
        } catch (ex) {
            next(ex);
        }
    });

};
