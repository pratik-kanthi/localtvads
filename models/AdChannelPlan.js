const mongoose = require('mongoose');

const name='AdChannelPlan';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
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
    Duration: {
        type: Number, // must be in the number of days
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

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};