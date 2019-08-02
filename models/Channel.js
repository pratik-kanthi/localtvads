const mongoose = require('mongoose');
const {addressSchema, contactSchema} = require.main.require('./models/CommonSchema');

var schema = new mongoose.Schema({
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
    Address: addressSchema,
    PrimaryContact: contactSchema,
    AlternativeContact: contactSchema
});