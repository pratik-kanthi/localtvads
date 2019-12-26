const Coupon = require.main.require('./models/Coupon').model;

/**
 * Save coupon
 * @param {String} couponObj - model object of coupon
 */

const saveCoupon = (couponObj) => {
    return new Promise(async (resolve, reject) => {
        if (!couponObj) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const coupon = new Coupon(couponObj);
        coupon.save(err => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: coupon
            });
        });
    });
};

module.exports = {
    saveCoupon
};
