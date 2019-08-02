const mongoose = require('mongoose');
const moment = require('moment');

var schema = new mongoose.Schema({
    Title: {
        type: String,
        required: true
    },
    SubTitle: {
        type: String
    },
    Benefits: [
        {
            type: String
        }
    ],
    Amount: {
        type: Number,
        required: true
    },
    IsRecommended: {
        type: Boolean,
        default: false
    },
    IsActive: {
        type: Boolean,
        default: true
    }
});