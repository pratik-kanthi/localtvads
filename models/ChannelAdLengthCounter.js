const mongoose = require('mongoose');

const name='Channel';

const schema = new mongoose.Schema({
    Channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    AdSchedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdSchedule',
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