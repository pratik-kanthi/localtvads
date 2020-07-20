const mongoose = require('mongoose');

const name = 'ProductLength';

const schema = new mongoose.Schema({
    Name: String,
    Duration: Number
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};