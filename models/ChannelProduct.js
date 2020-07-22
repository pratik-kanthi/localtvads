const mongoose = require('mongoose');

const name = 'ChannelProduct';

const schema = new mongoose.Schema({
    Name: {
        type: String,
    },
    Description: {
        type: String,
    },
    Channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true,
    },
    ProductLength: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductLength',
        required: true,
    },
    IsActive: {
        type: Boolean,
        default: true,
    },
    ChannelSlots: [{
        Slot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChannelSlot'
        },
        RatePerSecond: {
            type: Number,
            required: true
        },
        Duration: {
            type:Number
        }
    }]
});
const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema,
};