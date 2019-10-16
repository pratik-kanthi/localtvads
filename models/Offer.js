const mongoose = require('mongoose');

const name='Offer';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    ImageUrl: {
        type: String
    },
    AdSchedules: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AdSchedule'
        }
    ],
    Channels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
    }],
    Amount: {
        type: Number,
        required: true
    },
    AmountType: {
        type: String,
        enum: [ 'FIXED', 'PERCENTAGE' ],
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
