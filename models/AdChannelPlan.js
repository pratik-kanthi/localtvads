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