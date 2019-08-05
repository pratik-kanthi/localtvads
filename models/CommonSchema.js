const mongoose = require('mongoose');
const auditSchema = new mongoose.Schema({
    CreatedByUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    CreationDate: {
        type: Date,
        required: true,
        default: function() {
            return new Date();
        }
    },
    EditedByUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    EditDate: {
        type: Date
    }
});
const addressSchema = new mongoose.Schema({
    Line1: {
        type: String
    },
    Line2: {
        type: String
    },
    Area: {
        type: String
    },
    County: {
        type: String
    },
    TownCity: {
        type: String
    },
    PostCode: {
        type: String
    },
    Country: {
        type: String,
        default: "United Kingdom"
    },
    Latitude: {
        type: Number
    },
    Longitude: {
        type: Number
    }
});
const contactSchema = new mongoose.Schema({
    FirstName: {
        type: String
    },
    LastName: {
        type: String
    },
    Position: {
        type: String
    },
    Phone: {
        type: String
    },
    Fax: {
        type: String
    },
    Mobile: {
        type: String
    },
    OutOfHours: {
        type: String
    },
    Email: {
        type: String
    }
});
const ownerSchema = new mongoose.Schema({
    Type: {
        type: String
    },
    _id: {
        type: String,
    },
    Title: {
        type: String
    },
    Deleted: {
        type: Boolean,
        required: true,
        default: function() {
            return false;
        }
    },
    SubTitle: {
        type: String
    },
    ImageUrl: {
        type: String
    },
    Email: {
        type: String
    }
});
const logSchema = new mongoose.Schema({
    DateTime: {
        type: Date,
        required: true,
        default: function() {
            return new Date();
        }
    },
    Text: {
        type: String
    }
});
const billingSchema = new mongoose.Schema({
    BankName: {
        type: String,
        required: true
    },
    AccountNo: {
        type: String,
        required: true
    },
    AccountHolderName: {
        type: String,
        required: true
    },
    SortCode: {
        type: String,
        required: true
    },
    SavedCards: []
});

module.exports = {
    auditSchema,
    addressSchema,
    contactSchema,
    ownerSchema,
    logSchema,
    billingSchema
};