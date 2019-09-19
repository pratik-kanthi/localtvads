const Mailgun = require('mailgun-js');
const config = require.main.require('./config');

const options = {
    apiKey: config.mailgun.apiKey,
    domain: config.mailgun.domain
};

const server = new Mailgun(options).messages();

const api = {
    server: server
};

module.exports = {
    api
};