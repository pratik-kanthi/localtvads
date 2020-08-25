const mongoose = require('mongoose');
const {
    auditSchema
} = require.main.require('./models/CommonSchema');
const name = 'ClientResource';

const schema = new mongoose.Schema({
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    ResourceName: {
        type: String
    },
    ResourceType: {
        type: String,
        enum: ['IMAGE', 'VIDEO', 'DOCUMENT']
    },
    Management: {
        type: Boolean
    },
    ResourceUrl: {
        type: String,
    },
    Extension: {
        type: String,
    },
    AuditInfo: auditSchema,
});

const model = mongoose.model(name, schema);

module.exports = {
    name,
    model,
    schema,
};