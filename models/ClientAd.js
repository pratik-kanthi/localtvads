const mongoose = require('mongoose');

const name='ClientAd';

const schema = new mongoose.Schema({
    VideoUrl: {
        type: String
    },
    PreviewUrl: {
        type: String
    },
    PreviewDate: {
        type: Date
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    Status: {
        type: String,
        enum: ['DRAFT', 'UNDERREVIEW', 'APPROVED', 'REJECTED'],
        required: true
    },
    Length: { // length of the video in seconds
        type: Number
    },
    Comments: {
        type: String
    },
    Options: {}
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};

