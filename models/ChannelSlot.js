const mongoose = require('mongoose');
const { auditSchema } = require.main.require('./models/CommonSchema');

const name = 'ChannelSlot';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
    },
    Description: {
        type: String,
    },
    StartTime: {
        type: String,
    },
    EndTime: {
        type: String,
    },
    AuditInfo: auditSchema,
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema,
};
