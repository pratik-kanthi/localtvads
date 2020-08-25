const mongoose = require('mongoose');
const name = 'Counter';
const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
    },
    SequenceValue: {
        type: Number,
        required: true
    }
});
const model = mongoose.model(name, schema);
module.exports = {
    name: name,
    model: model,
    schema: schema
};