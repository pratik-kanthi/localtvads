/* eslint-disable no-console */
const winston = require('winston');
const DailyRotateFile = require('../../log-rotate');

winston.transports.DailyRotateFile = DailyRotateFile;
let _winston;
const config = require('../../config');

function replaceErrors(key, value) {
    if (value instanceof Error) {
        const error = {};
        Object.getOwnPropertyNames(value).forEach(function (key) {
            error[key] = value[key];
        });
        return error;
    }
    return value;
}


module.exports = function () {
    return {
        init:function(){
            const info_transport = new winston.transports.DailyRotateFile({
                name: 'info-logger',
                level: 'info',
                filename: config.winston.log_file_location + '/info_%DATE%.log',
                handleException: true,
                json: true,
                datePattern: 'YYYY-MM-DD',
                maxFiles: '7d',
                timestamp: false,
                zippedArchive: true,
                colorize: false,
            });
            const warn_transport = new winston.transports.DailyRotateFile({
                name: 'warn-logger',
                level: 'warn',
                filename: config.winston.log_file_location + '/warning_%DATE%.log',
                handleException: true,
                json: true,
                datePattern: 'YYYY-MM-DD',
                maxFiles: '7d',
                timestamp: false,
                zippedArchive: true,
                colorize: false
            });
            const debug_transport = new winston.transports.DailyRotateFile({
                name: 'debug-logger',
                level: 'debug',
                filename: config.winston.log_file_location + '/debug_%DATE%.log',
                handleException: true,
                json: true,
                datePattern: 'YYYY-MM-DD',
                maxFiles: '7d',
                timestamp: false,
                zippedArchive: true,
                colorize: false
            });
            const errors_transport = new winston.transports.DailyRotateFile({
                name: 'errors-logger',
                level: 'error',
                filename: config.winston.log_file_location + '/errors_%DATE%.log',
                handleException: true,
                json: true,
                datePattern: 'YYYY-MM-DD',
                maxFiles: '7d',
                timestamp: false,
                zippedArchive: true,
                colorize: false
            });
            _winston= new winston.Logger({
                transports: [info_transport, warn_transport, debug_transport, errors_transport],
                exitOnError: false
            });
        },
        logError: function logError(errText, errData) {
            try {
                if (!errData) {
                    errData = {};
                }
                errData = JSON.parse(JSON.stringify(errData, replaceErrors));
                errData.host = _host;
                errData.port = process.env.PORT;
                errData = Object.assign({
                    timestamp: new Date()
                }, errData);
                try {
                    _winston.error(errText, errData);
                } catch (err) {
                    console.log(err); 
                }
            } catch (err) {
                logger.logError('Error in Logger:logError', {
                    err: err
                });
            }

        },
        logWarning: function logWarning(warningText, warningData) {
            try {
                
                if (!warningData) {
                    warningData = {};
                }
                warningData = JSON.parse(JSON.stringify(warningData, replaceErrors));
                warningData.host = _host;
                warningData.port = process.env.PORT;
                warningData = Object.assign({
                    timestamp: new Date()
                }, warningData);
                _winston.warn(warningText, warningData);
            } catch (err) {
                logger.logError('Error in Logger:logWarning', {
                    err: err
                });
            }
        },
        logDebug: function logDebug(debugText, debugData) {
            try {
                if (!debugData) {
                    debugData = {};
                }
                debugData.host = _host;
                debugData.port = process.env.PORT;
                debugData = Object.assign({
                    timestamp: new Date()
                }, debugData);
                _winston.debug(debugText, debugData);
            } catch (err) {
                logger.logError('Error in Logger:logDebug', {
                    err: err
                });
            }

        },
        logInfo: function logInfo(infoText, infoData) {
            try {
                if (!infoData) {
                    infoData = {};
                }
                infoData.host = _host;
                infoData.port = process.env.PORT;
                infoData = Object.assign({
                    timestamp: new Date()
                }, infoData);
                _winston.info(infoText, infoData);
            } catch (err) {
                logger.logError('Error in Logger:logInfo', {
                    err: err
                });
            }
        }
    };
};