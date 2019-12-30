const mongoose = require('mongoose');

const name='Testimonial';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Company: {
        type: String
    },
    Description: {
        type: String
    },
    ImageUrl: {
        type: String
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