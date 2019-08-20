const mongoose = require('mongoose');
const adChannelPlanSchema = require.main.require('./models/AdChannelPlan').schema;
const {auditSchema} = require.main.require('./models/CommonSchema');
const clientAdSchema = require.main.require('./models/ClientAd').schema;

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
    ClientAd: clientAdSchema,
    AdChannelPlan: {
        Plan: adChannelPlanSchema,
        Surge: {
            type: Number
        },
        Extras: [],
        SubTotal: {
            type: Number,
            required: true
        },
        TaxAmount: {
            type: Number,
            required: true
        },
        TotalAmount: {
            type: Number,
            required: true
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
    IsRenewal: {
        type: Boolean,
        default: true
    },
    Status: {
        type: String,
        enum: ['ACTIVE','INACTIVE','EXPIRED'],
        default: 'ACTIVE'
    },
    AuditInfo: auditSchema
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};