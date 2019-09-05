const Tax = require.main.require('./models/Tax').model;

const getTaxes = (amount) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            Active: true
        };
        let project = {
            _id: 0,
            Name: 1,
            Description: 1,
            Type: 1,
            Value: 1
        };

        Tax.find(query, project, (err, taxes) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            let taxAmount = 0;
            taxes.map(tax => {
                if (tax.Type === 'FIXED') {
                    taxAmount += tax.Value;
                } else {
                    taxAmount += tax.Value * 0.01 * amount;
                }
            });
            resolve({
                totalTax: taxAmount,
                taxes: taxes
            });
        });
    });
};

module.exports = {
    getTaxes
};