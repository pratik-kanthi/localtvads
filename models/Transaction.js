const mongoose = require('mongoose');

const ServiceAddOnSchema = require.main.require('./models/ServiceAddOn').schema;

const name = 'Transaction';

const schema = new mongoose.Schema({
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    ClientAdPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientAdPlan'
    },
    ServiceAddOn: {
        type: ServiceAddOnSchema
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
        type: String
    },
    DateTime: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    },
    Coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    TaxBreakdown: [],
    StripeResponse: {}
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};
