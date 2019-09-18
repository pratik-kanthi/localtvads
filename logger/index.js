const log = require('../log');

module.exports = (app) => {
    const _sentry = require("./sentry")(app);

    //SETUP LOGGER
    switch (process.env.CURRENT_LOGGER) {
        case 'SENTRY':
            _sentry.setupSentry();
            break;
    }

    return {
        logError: (exc) => {
            log.error(exc);
            switch (process.env.CURRENT_LOGGER) {
                case 'SENTRY':
                    _sentry.logError(exc);
                    break;
                default:
                    console.log("Error: " + exc);
            }

        },
        logWarning: (warningText) => {
            log.warn(warningText);
            switch (process.env.CURRENT_LOGGER) {
                case 'SENTRY':
                    _sentry.logWarning(warningText);
                    break;
                default:
                    console.log("Warning: " + warningText);
            }

        },
        logDebug: (message, item) => {
            log.debug(message);
            switch (process.env.CURRENT_LOGGER) {
                case 'SENTRY':
                    _sentry.logDebug(message, item);
                    break;
                default:
                    console.log("Debug: " + new Date().toISOString() + message);
            }

        },
        logInfo: (infoText) => {
            log.info(infoText);
            switch (process.env.CURRENT_LOGGER) {
                case 'SENTRY':
                    _sentry.logInfo(infoText);
                    break;
                default:
                    console.log("Info: " + new Date().toISOString() + infoText);
            }

        }
    }
};