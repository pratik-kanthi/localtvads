const mongoose = require('mongoose');

const name='ChannelAdLengthCounter';

const schema = new mongoose.Schema({
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
    DateTime: {
        type: Date,
        required: true
    },
    TotalSeconds: {
        type: Number
    }
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};