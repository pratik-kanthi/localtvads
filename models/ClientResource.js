const mongoose = require('mongoose');
const { auditSchema } = require.main.require('./models/CommonSchema');
const name = 'ClientResource';

const schema = new mongoose.Schema({
    AssetType: ['IMAGE', 'VIDEO', 'TEXT'],
    AssetUrl: {
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
