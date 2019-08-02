const winston = require('winston');

const logger = new winston.createLogger({
    transports: [
        new winston.transports.File({
            name: 'info-logger',
            level: 'info',
            filename: process.cwd() + '/logs/info.log',
            handleException: true,
            json: true,
            maxSize: 5242880, //5mb
            maxFiles: 2,
            timestamp: true,
            colorize: false
        }),
        new winston.transports.File({
            name: 'debug-logger',
            level: 'debug',
            filename: process.cwd() + '/logs/debug.log',
            handleException: true,
            json: true,
            maxSize: 5242880, //5mb
            maxFiles: 2,
            timestamp: true,
            colorize: false
        }),
        new winston.transports.File({
            name: 'warning-logger',
            level: 'warn',
            filename: process.cwd() + '/logs/warning.log',
            handleException: true,
            json: true,
            maxSize: 5242880, //5mb
            maxFiles: 2,
            timestamp: true,
            colorize: false
        }),
        new winston.transports.File({
            name: 'errors-logger',
            level: 'error',
            filename: process.cwd() + '/logs/errors.log',
            handleException: true,
            json: true,
            maxSize: 5242880, //5mb
            maxFiles: 2,
            timestamp: true,
            colorize: false
        })
    ],
    exitOnError: false
});

module.exports = logger;