/* eslint no-console: 0 */

module.exports = (app) => {
    const _sentry = require('./sentry')(app);
    const _logfile = require('./logfile')();


    _sentry.setupSentry();
    _logfile.init();

    return {
        logError: (text) => {
            _sentry.logError(text);
            // _logfile.logError(text, data);
            //console.error('Error  : ' + new Date().toISOString() + ' --- ' + text + '||' + data);

        },

        logWarning: (text, data) => {
            // _sentry.logWarning(text);
            _logfile.logWarning(text, data);
            //console.warn('Warning  : ' + new Date().toISOString() + ' --- ' + text + '||' + data);
        },

        logDebug: (text, data) => {
            // _sentry.logDebug(text, data);
            _logfile.logDebug(text, data);
            //console.warn('Debug  : ' + new Date().toISOString() + ' --- ' + text + '||' + data);
        },

        logInfo: (text, data) => {
            // _sentry.logInfo(text);
            _logfile.logDebug(text, data);
            //console.warn('Info  : ' + new Date().toISOString() + ' --- ' + text + '||' + data);
        }
    };
};