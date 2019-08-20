const mongoose = require('mongoose');

const taxSchema = require('../models/Tax').schema;
const discountSchema = require('../models/AdDiscount').schema;
const adPlanSchema = require('./AdChannelPlan').schema;

const name = 'Transaction';

const schema = new mongoose.Schema({
    AdPlan: {
        adPlanSchema
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    ClientAd: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientAd',
        required: true
    },
    Amount: {
        type: Number,
        required: true
    },
    TaxBreakdown: [
        taxSchema
    ],
    TaxAmount: {
        type: Number,
        required: true
    },
    Discount: {
        discountSchema
    },
    TotalAmount: {
        type: Number,
        required: true
    },
    Status: {
        type: String,
        enum: ['succeeded', 'pending', 'failed'],
        required: true
    },
    ReferenceId: {
        type: String,
        required: true
    },
    DateTime: {
        type: Date,
        required: true
    },
    StripeResponse: {}
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};