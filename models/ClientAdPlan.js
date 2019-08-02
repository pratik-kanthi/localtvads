const mongoose = require('mongoose');
const adChannelPlan = require.main.require('./AdChannelPlan').schema;
const clientAdSchema = require.main.require('./ClientAd').schema;
const {auditSchema} = require.main.require('./CommonSchema');

var schema = new mongoose.Schema({
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
        ...adChannelPlan,
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