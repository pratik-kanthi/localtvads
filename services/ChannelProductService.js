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
            try {
                const result = await channnelProduct.save();
                logger.logInfo(`Channel Product ${channnelProduct.Name} created on ${product.Channel}`);
                resolve({
                    code: 200,
                    data: result
                });
            } catch (err) {
                logger.logError(`Failed to delete channel produt ${product._id}`, err);
                return reject({
                    code: 500,
                    error: err
                });
            }
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
        try {
            if (!product_id) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    }
                });
            }

            const query = {
                _id: product_id
            };
            await ChannelProduct.deleteOne(query).exec();
            logger.logInfo('Channel Product deleted');
            resolve({
                code: 200,
                data: true
            });
        } catch (err) {
            logger.logError(`Failed to delete channel produt ${product_id}`, err);
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