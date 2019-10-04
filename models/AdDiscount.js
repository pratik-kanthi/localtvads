const mongoose = require('mongoose');

const name='AdDiscount';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    ChannelPlans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdSchedule'
    }],
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
    },
    CouponCode: {
        type: String
    },
    PermittedUsageCount: {
        type: Number,
        default: 1
    }
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};