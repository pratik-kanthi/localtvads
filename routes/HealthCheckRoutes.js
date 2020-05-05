const Channel = require('../models/Channel').model;

module.exports = function (app) {
    app.get('/api/healthcheck', (req, res) => {
        Channel.findOne({}, {_id: 1}, (err) => {
            if (err) {
                return res.status(500).json(err);
            }
            res.status(200).send('OK');
        });
    });
};
