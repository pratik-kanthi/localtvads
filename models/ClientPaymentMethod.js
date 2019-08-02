const mongoose = require('mongoose');
const {billingSchema} = require.main.require('./models/CommonSchema');

const paymentCardSchema = new mongoose.Schema({
    CardToken: {
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
    },
    IsPreferred: {
        type: Boolean
    }
});

const schema = new mongoose.Schema({
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    Cards: [paymentCardSchema],
    BankInformation: billingSchema,
    Wallets: []
});