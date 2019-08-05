const mongoose = require('mongoose');
const commonSchema = require.main.require('./models/CommonSchema');

const name = "Client";

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Phone: {
        type: String
    },
    ImageUrl: {
        type: String
    },
    IsActive: {
        type: Boolean,
        default: true
    },
    Address: commonSchema.addressSchema
});

let model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};