const config = require('../config');
const mailgun = require('./config/mailgun');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

/**
 * Send social-user registration email
 * @param {String} to - email address of the user fetched from OAuth 2.0
 * @param {String} socialclient - AuthorisationScheme value from AccessToken model
 */
const socialRegisterEmail = (to, socialclient) => {
    const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/socialaccount_createdemail.ejs'), 'utf-8'), {
        social: socialclient
    });

    const data = {
        from: config.mailgun.fromemail,
        to: to,
        subject: 'Your Local TV Ads account has been created',
        html: message
    };
    mailgun.api.server.send(data, (err) => {
        if (err) {
            throw err;
        }
    });

};

/**
 *
 * @param {String} to - email address of the registered user
 * @param {String} verificationlink - verification link to mailed to the user to verify his/her account
 */
const standardRegisterEmail = (to, verificationlink) => {
    const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/standardaccount_createdemail.ejs'), 'utf-8'), {
        verificationlink: verificationlink
    });

    const data = {
        from: config.mailgun.fromemail,
        to: to,
        subject: 'Verify your Local TV Ads account',
        html: message
    };

    mailgun.api.server.send(data, (err) => {
        if (err) {
            throw err;
        }
    });
};


const passwordResetEmail = (to, verificationlink) => {
    const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/forgotpassword_email.ejs'), 'utf-8'), {
        verificationlink: verificationlink
    });

    const data = {
        from: config.mailgun.fromemail,
        to: to,
        subject: 'Password Reset Link',
        html: message
    };

    mailgun.api.server.send(data, (err) => {
        if (err) {
            throw err;
        }
    });
};


module.exports = {
    socialRegisterEmail: socialRegisterEmail,
    standardRegisterEmail: standardRegisterEmail,
    passwordResetEmail: passwordResetEmail
};
