const mongoose = require('mongoose');
const {addressSchema, contactSchema} = require.main.require('./models/CommonSchema');

const name='Channel';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    Status: {
        type: String,
        required: true,
        enum: ['PROSPECTS', 'LIVE','DORMANT', 'INACTIVE']
    },
    ExpectedAdViews: {
        type: Number
    },
    Address: addressSchema,
    PrimaryContact: contactSchema,
    AlternativeContact: contactSchema
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};