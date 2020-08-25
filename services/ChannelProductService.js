const ChannelProduct = require.main.require('./models/ChannelProduct').model;

const createChannelProduct = (product) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!product.Channel || !product.ProductLength || !product.ChannelSlots || product.ChannelSlots.length == 0) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    }
                });
            }
            const channnelProduct = new ChannelProduct(product);
            channnelProduct.save((err, saved) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                resolve({
                    code: 200,
                    data: saved
                });
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};


const deleteChannelProduct = (product_id) => {
    return new Promise(async (resolve, reject) => {
        if (!product_id) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                }
            });
        }
        try {
            ChannelProduct.deleteOne({
                _id: product_id
            }).exec((err) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                resolve({
                    code: 200,
                    data: true
                });
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

module.exports = {
    createChannelProduct,
    deleteChannelProduct
};