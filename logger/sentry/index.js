const Sentry = require('@sentry/node');
const os = require('os');

Sentry.init({
    serverName: process.env.SERVER_NAME,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.LOGGER_MODE
});

module.exports = (app) => {
    return {
        setupSentry: () => {

            //Setup generic sentry Error Handler for unhandled exception
            // The error handler must be before any other error middleware
            app.use(Sentry.Handlers.errorHandler());

            //Set Sentry User Context on All Requests
            app.all('*', (req, res, next) => {
                Sentry.configureScope( (scope) => {
                    scope.setUser({
                        IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null)
                    });
                    scope.setExtra('request', {
                        RequestURL: req.originalUrl,
                        Body: req.body,
                        Method: req.method
                    });
                });
                next();
            });

            app.use((err, req, res) => {
                // The error id is attached to `res.sentry` to be returned
                // and optionally displayed to the user for support.
                res.statusCode = 500;
                res.end(res.sentry + '\n');
            });

            //add hostname to all the logs
            Sentry.configureScope( (scope) => {
                scope.setExtra('hostname', os.hostname() + ':' + process.env.PORT);
            });
        },
        logError:(exc) => {
            if (exc instanceof Error) {
                Sentry.captureException(exc);
            } else {
                if (typeof exc == 'object') {
                    exc = JSON.stringify(exc);
                }
                exc = new Error(exc);
                Sentry.captureException(exc);
            }
        },
        logWarning: (log) => {
            if (typeof log == 'object') {
                log = JSON.stringify(log);
            }
            Sentry.captureMessage(log, 'warning');
        },
        logDebug: (message, item) => {
            Sentry.captureEvent({
                message: message,
                level: 'debug',
                extra: {
                    debugObject: item
                }
            });
        },
        logInfo: (log) => {
            if (typeof log == 'object') {
                log = JSON.stringify(log);
            }
            Sentry.captureMessage(log, 'info');
        }
    };
};
