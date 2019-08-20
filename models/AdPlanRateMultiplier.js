const mongoose = require('mongoose');

const name='AdPlanRateMultiplier';

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
    RateMultiplier: {
        type: Number,
        required: true
    },
    StartDate: {
        type: Date,
        required: true
    },
    EndDate: {
        type: Date,
        required: true
    }
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};