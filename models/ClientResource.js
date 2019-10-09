const mongoose = require('mongoose');

const name = 'ClientResource';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    ResourceUrl: {
        type: String,
    },
    Type: {
        type: String,
        enum: ['IMAGE', 'VIDEO', 'AUDIO']
    }
});

const model = mongoose.model(name, schema);

module.exports = {
    name,
    model,
    schema
};