const mongoose = require('mongoose');

const name='AdSchedule';

const schema = new mongoose.Schema({
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

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};