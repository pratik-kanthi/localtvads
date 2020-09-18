const ServiceAddOn = require.main.require('./models/ServiceAddOn').model;
const Tax = require.main.require('./models/Tax').model;

const getActiveAddOns = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = {
                IsActive: true,
            };
            const addOns = await ServiceAddOn.find(query).exec();
            query = {
                Active: true,
            };
            const taxes = await Tax.find(query).exec();
            const responseObj = [];
            if (taxes && addOns) {
                addOns.forEach((addOn) => {
                    addOn = addOn.toObject();
                    let taxAmount = 0;
                    taxes.forEach((tax) => {
                        if (tax.Type === 'FIXED') {
                            taxAmount += tax.Value;
                        } else {
                            taxAmount += tax.Value * 0.01 * addOn.Amount;
                        }
                    });
                    responseObj.push({
                        ...addOn,
                        TaxAmount: taxAmount,
                        TotalAmount: addOn.Amount + taxAmount
                    });
                });
                resolve({
                    code: 200,
                    data: responseObj,
                });

            } else {
                logger.logWarning('No addons fetched');
                resolve({
                    code: 200,
                    data: {},
                });
            }
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const saveServiceAddOn = (serviceAddonObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!serviceAddonObj) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const serviceAddOn = new ServiceAddOn(serviceAddonObj);
            await serviceAddOn.save();
            resolve({
                code: 200,
                data: serviceAddOn,
            });
        } catch (err) {
            logger.logError('Failed to create service addon', err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

module.exports = {
    getActiveAddOns,
    saveServiceAddOn
};