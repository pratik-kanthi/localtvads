const mongoose = require('mongoose');
const {
    auditSchema
} = require.main.require('./models/CommonSchema');

const name = 'ClientAdPlan';

const schema = new mongoose.Schema({
    Name: {
        type: String
    },
    Description: {
        type: String,
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    Channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
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
    Addons: [{
        Name: {
            type: String
        },
        Description: {
            type: String
        },
        Benefits: [{
            type: String
        }],
        Amount: {
            type: Number,
        }
    }],
    ChannelProduct: {
        ProductLength: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductLength',
            required: true,
        },
        ChannelSlots: [{
            Slot: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ChannelSlot'
            },
            RatePerSecond: {
                type: Number,
                required: true
            },
            Duration: {
                type: Number
            }
        }]
    },
    Days: [],
    PlanAmount: {
        type: Number
    },
    AddonsAmount: {
        type: Number
    },
    TotalAmount: {
        type: Number
    },
    TaxAmount: {
        type: Number
    },
    Taxes: [],
    Status: {
        type: String,
        enum: ['PAID', 'LIVE', 'EXPIRED'],
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