const Channel = require.main.require('./models/Channel').model;
const ChannelProduct = require.main.require('./models/ChannelProduct').model;
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ImageService = require('./ImageService');


const uploadLogo = async (channelId, file) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!channelId || !file) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const channel = await Channel.findOne({
                _id: channelId
            });

            if (!channel) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Channel not found',
                    },
                });
            }

            const destination = 'uploads/channels/' + channelId + '/logo_' + Date.now() + '.png';
            const oldFileLocation = channel.ImageUrl;
            channel.ImageUrl = destination;

            try {
                await ImageService._uploadFileToBucket(file, destination, oldFileLocation, channel);
            } catch (err) {
                logger.logError(`Channel logo upload failed for ${channel.Name}`, err);
                return reject({
                    code: 500,
                    error: err,
                });
            }
            resolve({
                code: 200,
                data: channel
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const createChannel = (newchannel) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!newchannel.Name || !newchannel.Status) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const ch = new Channel({
                Name: newchannel.Name,
                Description: newchannel.Description ? newchannel.Description : null,
                Status: newchannel.Status,
            });
            const result = await ch.save();
            resolve({
                code: 200,
                data: result,
            });
        } catch (err) {
            logger.logError('Channel Creation failed', err);
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const getProductsOfChannel = (channelId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!channelId) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                Channel: channelId
            };
            const result = await ChannelProduct.find(query).deepPopulate('ProductLength ChannelSlots.Slot').exec();
            resolve({
                code: 200,
                data: result,
            });

        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const getChannels = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = {
                Status: {
                    $in: ['LIVE'],
                },
            };
            const channels = await Channel.find(query).exec();
            resolve({
                code: 200,
                data: channels
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};

const getChannelsWithMetrics = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let channels = await Channel.find({}).exec();
            const plans = await ClientAdPlan.find({}).exec();

            channels = channels.map(channel => {
                channel = channel.toObject();
                channel.planCount = 0;
                plans.map(plan => {
                    if (channel._id == plan.Channel.toString()) {
                        channel.planCount++;
                    }
                    return plan;
                });
                return channel;
            });

            const products = await ChannelProduct.find({}).exec();

            channels = channels.map(channel => {
                channel.productCount = 0;
                products.map(product => {
                    if (channel._id == product.Channel.toString()) {
                        channel.productCount++;
                    }
                    return product;
                });
                return channel;
            });

            resolve({
                code: 200,
                data: channels
            });

        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const getChannel = (channel_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!channel_id) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const query = {
                _id: channel_id,
            };
            const channels = await Channel.findOne(query).exec();
            resolve({
                code: 200,
                data: channels
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });

        }
    });
};


const getLowestPriceOnChannel = (channel) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!channel) {
                return reject({
                    code: 400,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }
            const channelProducts = await ChannelProduct.find({
                Channel: channel
            }).exec();
            if (!channelProducts || channelProducts.length == 0) {
                return reject({
                    code: 404,
                    error: {
                        message: 'No plan found for channel',
                    }
                });
            }
            let lowestRate = 0;
            for (let i = 0, len = channelProducts.length; i < len; i++) {
                channelProducts[i].ChannelSlots.map(function (slot) {
                    const rate = slot.RatePerSecond * slot.Duration;
                    if (!lowestRate) {
                        lowestRate = rate;
                    }
                    if (lowestRate > rate) {
                        lowestRate = rate;
                    }
                    return '';
                });
            }
            resolve({
                code: 200,
                data: lowestRate.toString()
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
            });
        }
    });
};


module.exports = {
    uploadLogo,
    createChannel,
    getChannels,
    getChannelsWithMetrics,
    getProductsOfChannel,
    getChannel,
    getLowestPriceOnChannel
};
