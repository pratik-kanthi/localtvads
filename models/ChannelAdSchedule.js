const mongoose = require('mongoose');
const name = 'ChannelAdSchedule';

const schema = new mongoose.Schema({
    Channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true,
    },
    AdSchedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdSchedule',
        required: true,
    },
    TotalAvailableSeconds: {
        type: Number,
        required: true,
    },
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema,
};
