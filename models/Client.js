const mongoose = require('mongoose');
const commonSchema = require.main.require('./models/CommonSchema');

const name = 'Client';

const schema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Phone: {
        type: String
    },
    ImageUrl: {
        type: String
    },
    IsActive: {
        type: Boolean,
        default: true
    },
    Address: commonSchema.addressSchema,
    DateCreated: {
        type: Date,
        required: true,
        default: () => {
            return new Date();
        }
    }
});


/* eslint-disable */
schema.post('save', true, function (client, next) {

    let User = require('./User').model;
    let query = {
        Email: client.Email
    };

    User.findOne(query, function (err, data) {
        if (err) {
            next();

        } else if (data) {
            data.Owner = {
                Type: "Client",
                _id: client._id.toString().valueOf(),
                Title: client.Name,
                ImageUrl: client.ImageUrl,
                Email: client.Email,
                Phone: data.Phone,
                Deleted: false
            };
            data.save(function (err) {
                if (err) {
                    next();
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    });
});
/* eslint-enable */

const model = mongoose.model(name, schema);

module.exports = {
    name: name,
    model: model,
    schema: schema
};