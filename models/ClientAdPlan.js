const mongoose = require('mongoose');
const channelPlanSchema = require.main.require('./models/ChannelPlan').schema;
const { auditSchema } = require.main.require('./models/CommonSchema');

const name = 'ClientAdPlan';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
    },
    Description: {
        type: String,
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    ClientAd: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientAd',
    },
    Category: {
        type: String,
    },
    Comments: {
        type: String,
    },
    ChannelPlan: {
        Plan: channelPlanSchema,
        Surge: {
            type: Number,
        },
        Discount: {
            type: Number,
        },
        Extras: [],
        SubTotal: {
            type: Number,
        },
        TaxAmount: {
            type: Number,
        },
        TotalAmount: {
            type: Number,
        },
    },
    PlanLength: {
        type: Number,
        enum: [3, 6],
    },
    Status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    },
    BookedDate: {
        type: Date,
        default: () => {
            return new Date();
        },
        required: true,
    },
    AuditInfo: auditSchema,
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema,
};
