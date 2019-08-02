const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    AdSlot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdSlot',
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