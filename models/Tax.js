var mongoose = require('mongoose');

var name = 'Tax';

var schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    Type: {
        type: String,
        enum: ['PERCENTAGE','FIXED'],
        required: true
    },
    Value:{
        type: Number,
        required: true
    },
    Active:{
        type: Boolean,
        required: true
    }
});

var model = mongoose.model(name, schema);
module.exports = {
    name: name,
    model: model,
    schema: schema
};