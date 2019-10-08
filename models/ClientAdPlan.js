const mongoose = require('mongoose');
const channelPlanSchema = require.main.require('./models/ChannelPlan').schema;
const {auditSchema} = require.main.require('./models/CommonSchema');

const name='ClientAdPlan';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    ClientAd: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientAd'
    },
    ChannelPlan: {
        Plan: channelPlanSchema,
        Surge: {
            type: Number
        },
        Discount: {
            type: Number
        },
        Extras: [],
        SubTotal: {
            type: Number
        },
        TaxAmount: {
            type: Number
        },
        TotalAmount: {
            type: Number
        },
    },
    StartDate: {
        type: Date,
        default: ()=> {
            return new Date()
        }
    },
    EndDate: {
        type: Date,
        required: true
    },
    DayOfWeek: {
        type: Number,
        required: true
    },
    IsRenewal: {
        type: Boolean,
        default: true
    },
    Status: {
        type: String,
        enum: ['ACTIVE','INACTIVE','EXPIRED']
    },
    AuditInfo: auditSchema
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};