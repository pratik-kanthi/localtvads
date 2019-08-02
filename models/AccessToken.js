const mongoose = require('mongoose');

const name='AccessToken';

var schema = new mongoose.Schema({
    UserId: String,
    UserName: String,
    TokenString: String,
    Owner: {},
    iat: {
        type: Number
    }
});

const model = mongoose.model(name, schema);
module.exports = {
    name: name,
    model: model,
    schema: schema
};