const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    AdPlans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdSlot'
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
        enum: ['Fixed','Percentage'],
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
    },
    UsageCount: {
        type: Number,
        default: 0
    }
});