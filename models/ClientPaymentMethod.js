const mongoose = require('mongoose');
const name = 'ClientPaymentMethod';

const paymentCardSchema = new mongoose.Schema({
    PaymentMethodType: {
        type: String,
        enum: ['CARD'],
        default: 'CARD'
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
    IsPreferred: {
        type: Boolean
    },
    StripeCardToken: {
        type: String,
        required: true
    },
    Card: paymentCardSchema,
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};