const mongoose = require('mongoose');
const name = 'Subscriber';

const schema = new mongoose.Schema({
    DateSubscribed: {
        type: Date,
        required: true
    },
    Email: {
        type: String,
        required: true,
        unique: true
    },
    IsActive: Boolean,
    IpAddress: {
        type: String,
        required: false
    }
});


const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};