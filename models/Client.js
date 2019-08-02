const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Phone: {
        type: String,
        required: true
    },
    IsActive: {
        type: Boolean,
        default: true
    }
});