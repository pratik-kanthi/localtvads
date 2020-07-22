const Tax = require.main.require('./models/Tax').model;

/**
 * Add an Image
 * @param {Number} amount - amount in pounds
 */
const getTaxAmount = (amount) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            Active: true
        };
        const project = {
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
            if (amount) {
                taxes.forEach(tax => {
                    if (tax.Type === 'FIXED') {
                        taxAmount += tax.Value;
                    } else {
                        taxAmount += tax.Value * 0.01 * amount;
                    }
                });
            }
            resolve({
                totalTax: taxAmount,
                taxes: taxes
            });
        });
    });
};

const getAllTaxes = () => {
    return new Promise((resolve, reject) => {
        Tax.find({}).lean().exec((err, taxes) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({code:200, data:taxes});
        });
    });
};

module.exports = {
    getTaxAmount,
    getAllTaxes
};
