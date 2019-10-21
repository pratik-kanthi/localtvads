const mongoose = require('mongoose');

const name='ServiceAddOn';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    Benefits: [
        {
            type: String
        }
    ],
    Amount: {
        type: Number,
        required: true
    },
    IsRecommended: {
        type: Boolean,
        default: false
    },
    IsUploadRequired: {
        type: Boolean,
        default: false
    },
    IsActive: {
        type: Boolean,
        default: true
    }
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};
