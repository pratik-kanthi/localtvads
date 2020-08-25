const mongoose = require('mongoose');

const name = 'AccessToken';

const schema = new mongoose.Schema({
    UserId: String,
    UserName: String,
    TokenString: String,
    Owner: {},
    iat: {
        type: Number
    },
    AuthorisationScheme: {
        type: String
    },
    Claims: {
        type: String
    }
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};