const mongoose = require('mongoose');

const name='Slider';

const schema = new mongoose.Schema({
    Title: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    ImageUrl: {
        type: String
    },
    IsActive: {
        type: Boolean
    }
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};