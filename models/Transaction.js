const mongoose = require('mongoose');

const name = 'Transaction';
const schema = new mongoose.Schema({
    ReceiptNo: {
        type: String,
    },
    Client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    ClientAdPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientAdPlan',
    },
    TotalAmount: {
        type: Number,
        required: true,
    },
    TaxAmount: {
        type: Number,
        required: true,
    },
    Amount: {
        type: Number,
        required: true,
    },
    Status: {
        type: String,
        enum: ['SUCCEEDED', 'PENDING', 'FAILED'],
        required: true,
    },
    ReferenceId: {
        type: String,
    },
    DateTime: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        },
    },
    Coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
    },
    TaxBreakdown: [],
    StripeResponse: {},
    StripeResponseCode: {
        type: String,
    },

    ReceiptUrl: String,
});


/* eslint-disable */
schema.pre("save", function (next) {
    let self = this;
    let prefix = "LTV"
    if (!self.ReceiptNo) {
        getNextSequenceValue().then(function (ReceiptNo) {
            self.ReceiptNo = prefix + ReceiptNo;
            next();
        }, function (err) {
            console.error(err);
            next(new Error('Eror while generating unique sequence'))
        });
    } else {
        next();
    }
});



const getNextSequenceValue = () => {
    return new Promise(async (resolve, reject) => {
        const Counter = require('./Counter').model;
        try {
            const updatedCounter = await Counter.findOneAndUpdate({
                Name: "TransactionCounter"
            }, {
                $inc: {
                    SequenceValue: 1
                }
            }, {
                new: true
            }).exec();
            resolve(updatedCounter.SequenceValue);

        } catch (err) {
            console.error(err);
            return reject(err);
        }
    });
}

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema,
};