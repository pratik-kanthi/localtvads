const mongoose = require('mongoose');
const {auditSchema} = require.main.require('./models/CommonSchema');

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
    },
    AuditInfo: auditSchema
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};