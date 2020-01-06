const mongoose = require('mongoose');
const commonSchema = require.main.require('./models/CommonSchema');

const name = 'Staff';

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
    Address: commonSchema.addressSchema
});


/* eslint-disable */
schema.post('save', true, function (staff, next) {

    let User = require('./User').model;
    let query = {
        Email: staff.Email
    };

    User.findOne(query, function (err, data) {
        if (err) {
            next();

        } else if (data) {
            data.Owner = {
                Type: "Staff",
                _id: staff._id.toString().valueOf(),
                Title: staff.Name,
                ImageUrl: staff.ImageUrl,
                Email: staff.Email,
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
