const mongoose = require('mongoose');
const commonSchema = require('./CommonSchema');

const name = 'FAQ';
const schema = new mongoose.Schema({
    Question: {
        type: String,
        required: true,
    },
    Answer: {
        type: String,
        required: true,
    },
    Order: {
        type: Number,
    },
    AuditInfo: {
        type: commonSchema.auditSchema,
    },
});
const model = mongoose.model(name, schema);
module.exports = {
    name: name,
    model: model,
    schema: schema,
};
