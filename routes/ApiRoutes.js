const passport = require('passport');

const controllerBuilder = require('../controllers/BaseController');

module.exports = (app, models) => {
    for (const key in models) {
        if (Object.prototype.hasOwnProperty.call(models, key)) {
            const controller = controllerBuilder(models[key]);
            app.get('/api/' + key, passport.authenticate('jwt', {session: false}), controller.get);
            app.get('/api/' + key + '/count', passport.authenticate('jwt', {session: false}), controller.count);
            app.get('/api/' + key + '/:_id', passport.authenticate('jwt', {session: false}), controller.getById);
            app.put('/api/' + key + '/:_id', passport.authenticate('jwt', {session: false}), controller.put);
        }
    }

    app.use(function (req, res, next) {
        res.status(404);
        res.json({
            error: 'Not found'
        });
        const err_log = {
            err: 'Not found',
            code: 404,
            method: req.method,
            url: req.url
        };
        logger.logWarning('API Error', err_log);
        next();
    });

    app.use(function (err, req, res, next) {
        res.status(err.code || 500);
        const err_log = {
            err: err.error ? err.error : err,
            code: res.statusCode,
            method: req.method,
            url: req.url
        };
        if (req.user && req.user.user_name) {
            err_log.username = req.user.user_name;
        }

        logger.logWarning('API Error', err_log);
        if (err.error && err.error.stack) {
            delete err.error.stack;
            res.status(err.code || 500).send({
                message: err.error.message ? err.error.message : 'An error has occurred'
            });
        } else {
            res.status(err.code || 500).send(err);
        }
        next(false);
    });
};
