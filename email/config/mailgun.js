const Mailgun = require('mailgun-js');
const config = require('../../config');

const options = {
    apiKey: config.mailgun.apiKey,
    domain: config.mailgun.domain
}

/* const attachment = new Mailgun.Attachment({
    data: {},
    filename: ""
}); */

const server = new Mailgun(options).messages();

const api = {
    server: server
};

module.exports = {
    api: api
}