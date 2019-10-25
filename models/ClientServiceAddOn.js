const mongoose = require('mongoose');

const name='ClientServiceAddOn';

const schema = new mongoose.Schema({
    Images:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ClientResource'
        }
    ],
    Videos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ClientResource'
        }
    ],
    Text: {
        type: String
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    ServiceAddOn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceAddOn',
        required: true
    },
    DateTime: {
        type: Date,
        default: () => {
            return new Date();
        }
    }
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};
