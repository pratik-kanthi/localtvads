const mongoose = require('mongoose');
const name = "Enquiry";

const schema = new mongoose.Schema({
    Date: {
        type: Date,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    Subject: {
        type: String,
        required: true
    },
    Message: {
        type: String,
        required: true
    }
});


const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};