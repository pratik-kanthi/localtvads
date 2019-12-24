const passport = require('passport');

const controllerBuilder = require('../controllers/BaseController');
const log = require('../log');

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

    app.use((req, res, next) => {
        res.status(404);
        log.error('%s %d %s', req.method, res.statusCode, req.url);
        res.json({
            message: 'Not found'
        });
        next(false);
    });

    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        log.error('%s %d %s', req.method, res.statusCode, err.message);
        res.json({
            message: err.message
        });
        next(false);
    });
};
