const mongoose = require('mongoose');
const adPlanSchema = require.main.require('./models/ChannelPlan').schema;

const name = 'Transaction';

const schema = new mongoose.Schema({
    ChannelPlan: {
        adPlanSchema
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    ClientAdPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientAdPlan',
        required: true
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
            return new Date()
        }
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