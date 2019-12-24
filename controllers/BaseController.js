const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const odata = require('../odata');

module.exports = (def) => {
    const Model = def.model;
    Model.schema.plugin(deepPopulate);

    const getAll = (req, res) => {
        const Channels = req.user.Channels || [];
        //query string that filters just the records with the selected Brands or no brand all together
        const querystring = [{
            Channel: {
                $in: Channels
            }
        }, {
            Channel: {
                $exists: false
            }
        }, {
            Channel: {
                $eq: null
            }
        }];
        let query = Model.find();

        if (req.query.$select || req.query.$expand) {
            query = odata.selectExpandParser(query, req.query.$select, req.query.$expand);
        }

        if (req.query.$filter) {
            query = odata.filterParser(query, req.query.$filter);
        }

        if (req.query.$top) {
            query = odata.topParser(query, req.query.$top);
        }

        if (req.query.$skip) {
            query = odata.skipParser(query, req.query.$skip);
        }

        if (req.query.$orderBy) {
            query = odata.orderByParser(query, req.query.$orderBy);
        }
        query = query.or(querystring);


        query.exec((err, models) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).json(models);
            }
        });
    };

    const count = (req, res) => {
        const Channels = req.user.Channels || [];
        //query string that filters just the records with the selected Brands or no brand all together
        const querystring = [{
            Channel: {
                $in: Channels
            }
        }, {
            Channel: {
                $exists: false
            }
        }, {
            Channel: {
                $eq: null
            }
        }];
        let query = Model.count();

        query = odata.selectExpandParser(query, '_id', null);
        if (req.query.$filter) {
            query = odata.filterParser(query, req.query.$filter);
        }

        query = query.or(querystring);
        query.exec((err, count) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(200).json({
                Count: count
            });
        });
    };

    const getOne = (req, res) => {
        const Channels = req.user.Channels || [];

        //query string that filters just the records with the requested Id, selected brands or no brand all together

        const querystring = {
            $and: [{
                _id: req.params._id
            }, {
                $or: [{
                    Channel: {
                        $in: Channels
                    }
                }, {
                    Channel: {
                        $exists: false
                    }
                }, {
                    Channel: {
                        $eq: null
                    }
                }]
            }]
        };

        Model.findOne(querystring, (err, model) => {
            if (err) {
                res.send(err);
            } else {
                if (model) {
                    res.json(model);
                } else {
                    res.status(404).json({
                        error: 'Not Found'
                    });
                }
            }
        });
    };

    const putUpdate = (req, res) => {
        const querystring = {
            _id: req.params._id
        };
        Model.findOne(querystring, function (err, data) {
            if (err) {
                res.send(err);
            } else {
                if (data) {
                    for (const field in req.body) {
                        if (field !== '_id') {
                            data[field] = req.body[field];
                        }
                    }
                    if (!data.AuditInfo) {
                        data.AuditInfo = {};
                    }
                    data.AuditInfo.EditedByUser = req.user._id;
                    data.AuditInfo.EditDate = new Date();
                    data.save(function (err) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            res.status(200).json(data);
                        }
                    });
                } else {
                    res.status(404).json({
                        error: 'Not Found'
                    });
                }
            }
        });
    };

    return {
        get: getAll,
        count: count,
        getById: getOne,
        put: putUpdate
    };
};
