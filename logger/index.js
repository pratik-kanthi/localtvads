/* eslint no-console: 0 */

module.exports = (app) => {
    const _sentry = require('./sentry')(app);
    const _logfile = require('./logfile')();

    //SETUP LOGGER
    switch (process.env.CURRENT_LOGGER) {
    case 'SENTRY':
        _sentry.setupSentry();
        break;
    case 'LOGFILE':
        _logfile.init();
        break;
    }

    return {
        logError: (text, data) => {
            switch (process.env.CURRENT_LOGGER) {
            case 'SENTRY':
                _sentry.logError(text);
                break;
            case 'LOGFILE':
                _logfile.logError(text, data);
                break;
            default:
                if (data && typeof data == 'object') {
                    data = JSON.stringify(data);
                }
                console.error('Error  : ' + new Date().toISOString() + ' --- ' + text + '||' + data);
            }

        },
        logWarning: (text, data) => {
            switch (process.env.CURRENT_LOGGER) {
            case 'SENTRY':
                _sentry.logWarning(text);
                break;
            case 'LOGFILE':
                _logfile.logWarning(text, data);
                break;
            default:
                if (data && typeof data == 'object') {
                    data = JSON.stringify(data);
                }
                console.warn('Warning  : ' + new Date().toISOString() + ' --- ' + text + '||' + data);
            }

        },
        logDebug: (text, data) => {
            switch (process.env.CURRENT_LOGGER) {
            case 'SENTRY':
                _sentry.logDebug(text, data);
                break;
            case 'LOGFILE':
                _logfile.logDebug(text, data);
                break;
            default:
                if (data && typeof data == 'object') {
                    data = JSON.stringify(data);
                }
                console.warn('Debug  : ' + new Date().toISOString() + ' --- ' + text + '||' + data);
            }

        },
        logInfo: (text, data) => {
            switch (process.env.CURRENT_LOGGER) {
            case 'SENTRY':
                _sentry.logInfo(text);
                break;
            case 'LOGFILE':
                _logfile.logDebug(text, data);
                break;
            default:
                if (data && typeof data == 'object') {
                    data = JSON.stringify(data);
                }
                console.warn('Info  : ' + new Date().toISOString() + ' --- ' + text + '||' + data);
            }

        }
    };
};