const mongoose = require('mongoose');
const moment = require('moment');

var schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: [{
        type: String
    }],
    StartTime: {
        type: Date
    },
    EndTime: {
        type: Date
    },
    TotalRequiredSeconds: {
        type: Number
    },
    IsActive: {
        type: Boolean,
        default: true
    }
});