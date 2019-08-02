const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    Description: {
        type: String
    },
    VideoUrl: {
        type: String,
        required: true
    },
    Status: {
        type: String,
        enum: ['UNDERREVIEW','APPROVED','REJECTED'],
        required: true
    },
    Length: {         // length of the video in seconds
        type: Number,
        required: true
    },
    Comments: {
        type: String
    }
});