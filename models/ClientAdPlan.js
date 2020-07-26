const mongoose = require('mongoose');
const { auditSchema } = require.main.require('./models/CommonSchema');

const name = 'ClientAdPlan';

const schema = new mongoose.Schema({
    Name: {
        type: String,
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
    Category: {
        type: String,
    },
    Comments: {
        type: String,
    },
    Addons: [{}],
    ChannelProduct: {
        ProductLength: {},
        ChannelSlots: [
            {
                Slot: {},
                RatePerSecond: {
                    type: Number,
                    required: true,
                },
                Duration: {
                    type: Number,
                },
            },
        ],
    },
    AdVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientResource',
    },
    AddOnAssets: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ClientResource',
        },
    ],
    StartDate: {
        type: Date,
    },
    ExpiryDate: {
        type: Date,
    },
    Days: [],
    WeeklyAmount: {
        type: Number,
    },
    AddonsAmount: {
        type: Number,
    },
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
