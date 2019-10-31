const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const name = 'ChannelPlan';

const schema = new mongoose.Schema({
    Name: {
        type: String
    },
    Description: {
        type: String
    },
    Channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    ChannelAdSchedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChannelAdSchedule',
        required: true
    },
    Seconds: { // length of the video
        type: Number,
        enum: [20, 30],
        required: true
    },
    BaseAmount: {
        type: Number,
        required: true
    },
    IsActive: {
        type: Boolean,
        default: true
    }
});

schema.plugin(deepPopulate, {
    populate: {
        'ChannelAdSchedule': {
            select: 'AdSchedule'
        },
        'ChannelAdSchedule.AdSchedule': {
            select: 'Name'
        }
    }
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};
