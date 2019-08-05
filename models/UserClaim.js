const mongoose = require('mongoose');

const name = "UserClaim";

const schema = new mongoose.Schema({
    UserId: String,
    ClaimType: String,
    ClaimValue: String
});

let model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};