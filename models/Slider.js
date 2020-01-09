const mongoose = require('mongoose');
const {auditSchema} = require.main.require('./models/CommonSchema');

const name='Slider';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    Order: {
        type: Number
    },
    ImageUrl: {
        type: String
    },
    IsActive: {
        type: Boolean,
        default: true
    },
    AuditInfo: auditSchema
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};