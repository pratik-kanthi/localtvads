const mongoose = require('mongoose');
const {billingSchema} = require.main.require('./models/CommonSchema');

const name='ClientPaymentMethod';

const paymentCardSchema = new mongoose.Schema({
    PaymentMethodType: {
        type: String,
        enum: ['CARD'],
        default: 'CARD'
    },
    StripeCardToken: {
        type: String,
        required: true
    },
    Vendor: {
        type: String,
        required: true
    },
    Name: {
        type: String
    },
    ExpiryMonth: {
        type: String,
        required: true
    },
    ExpiryYear: {
        type: String,
        required: true
    },
    LastFour: {
        type: String,
        required: true
    }
});

const schema = new mongoose.Schema({
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    StripeCusToken: {
        type: String
    },
    IsPreferred: {
        type: Boolean
    },
    Card: paymentCardSchema,
    BankInformation: billingSchema
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};