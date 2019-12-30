const moment = require('moment');

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

const getCouponsByDuration = (startDate, endDate) => {
    return new Promise(async (resolve, reject) => {
        const query = {
            $or: [
                {
                    $and: [
                        {
                            StartDate: {
                                $lte: moment(startDate, 'YYYY-MM-DD').startOf('day').toDate()
                            }
                        }, {
                            EndDate: {
                                $gte: moment(startDate, 'YYYY-MM-DD').endOf('day').toDate()
                            }
                        }
                    ]
                },
                {
                    $and: [
                        {
                            StartDate: {
                                $gte: moment(startDate, 'YYYY-MM-DD').startOf('day').toDate()
                            }
                        }, {
                            EndDate: {
                                $lte: moment(endDate, 'YYYY-MM-DD').endOf('day').toDate()
                            }
                        }
                    ]
                },
                {
                    $and: [
                        {
                            StartDate: {
                                $lte: moment(endDate, 'YYYY-MM-DD').startOf('day').toDate()
                            }
                        }, {
                            EndDate: {
                                $gte: moment(endDate, 'YYYY-MM-DD').endOf('day').toDate()
                            }
                        }
                    ]
                }
            ]
        };
        const projection = {
            _id: 1,
            Name: 1,
            StartDate: 1,
            EndDate: 1,
            Amount: 1,
            Description: 1,
            AdSchedules: 1,
            Channels: 1,
            Client: 1,
            CouponCode: 1,
            AmountType: 1
        };
        const populateOptions = [
            {
                path: 'AdSchedules',
                select: {
                    Name: 1
                }
            },
            {
                path: 'Channels',
                select: {
                    Name: 1
                }
            },
            {
                path: 'Client',
                select: {
                    Name: 1
                }
            }
        ];
        Coupon.find(query, projection).populate(populateOptions).exec((err, coupons) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: coupons
            });
        });
    });
};

module.exports = {
    saveCoupon,
    getCouponsByDuration
};
