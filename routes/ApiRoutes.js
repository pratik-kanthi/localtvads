const controllerBuilder = require('../controllers/BaseController');
const log = require('../log')(module);
const {authenticate} = require.main.require('./middlewares/Auth');

module.exports = (app, models) => {
    for (let key in models) {
        if (models.hasOwnProperty(key)) {
            let controller = controllerBuilder(models[key]);
            app.get('/api/' + key,authenticate,  controller.get);
            app.get('/api/' + key + "/count", controller.count);
            app.get('/api/' + key + '/:_id', controller.getById);
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