const mongoose = require('mongoose');
const {
    auditSchema,
    addressSchema
} = require.main.require('./models/CommonSchema');

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
    BusinessName: {
        type: String,
    },
    VAT: {
        type: String,
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
        ChannelSlots: [{
            Slot: {},
            RatePerSecond: {
                type: Number,
                required: true,
            },
            Duration: {
                type: Number,
            },
        }, ],
    },
    AdVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientResource',
    },
    AddOnAssets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientResource',
    }, ],
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
        enum: ['PAYMENT_PROCESSING', 'PAYMENT_INCOMPLETE', 'PAID', 'LIVE', 'REJECTED', 'EXPIRED', 'INACTIVE'],
    },
    BookedDate: {
        type: Date,
        default: () => {
            return new Date();
        },
        required: true,
    },
    StripeReferenceId: {
        type: String,
    },
    PaymentMethod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientPaymentMethod',
    },
    IsSubscription: {
        type: Boolean,
        require: true
    },
    BillingAddress: addressSchema,
    AuditInfo: auditSchema,
});

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema,
};