const mongoose = require('mongoose');

const name = 'ChannelPlan';

const schema = new mongoose.Schema({
    Name: {
        type: String
    },
    Description: {
        type: String
    },
    AdSchedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdSchedule',
        required: true
    },
    Channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    Seconds: {         // length of the video
        type: Number,
        required: true
    },
    TotalAvailableSeconds: {
        type: Number
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

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};