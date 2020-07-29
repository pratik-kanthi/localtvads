const mongoose = require('mongoose');

const name = 'Transaction';

const schema = new mongoose.Schema({
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    ClientAdPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientAdPlan',
    },
    TotalAmount: {
        type: Number,
        required: true,
    }, 
    TaxAmount: {
        type: Number,
        required: true,
    },
    Amount: {
        type: Number,
        required: true,
    },
    Status: {
        type: String,
        enum: ['SUCCEEDED', 'PENDING', 'FAILED'],
        required: true,
    },
    ReferenceId: {
        type: String,
    },
    DateTime: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        },
    },
    Coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
    },
    TaxBreakdown: [],
    StripeResponse: {},
    StripeResponseCode: {
        type: String,
    },

    ReceiptUrl: String,
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema,
};
