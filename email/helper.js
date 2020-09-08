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

    try {
        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/socialaccount_createdemail.ejs'), 'utf-8'), {
            social: socialclient,
            email: to,
            year: date.getFullYear(),
        });

        const data = {
            from: config.mailgun.fromemail,
            to: to,
            subject: 'Your Local TV Ads account has been created',
            html: message,
        };
        mailgun.api.server.send(data, (err) => {
            if (err) {
                throw err;
            }
        });
    } catch (err) {
        logger.logError(`Failed to send registration email to ${to}`, err);
        throw err;
    }

};

/**
 *
 * @param {String} to - email address of the registered user
 * @param {String} verificationlink - verification link to mailed to the user to verify his/her account
 */
const standardRegisterEmail = (to, verificationlink) => {

    try {

        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/standardaccount-createdemail.ejs'), 'utf-8'), {
            verificationlink: verificationlink,
            year: date.getFullYear(),
        });

        const data = {
            from: config.mailgun.fromemail,
            to: to,
            subject: 'Verify your Local TV Ads account',
            html: message,
        };

        mailgun.api.server.send(data, (err) => {
            if (err) {
                throw err;
            }
        });

    } catch (err) {
        logger.logError(`Failed tp send registration email to ${to}`, err);
        throw err;
    }

};

/**
 *
 * @param {String} to - email address of the registered user
 * @param {String} verificationlink - verification link to mailed to the user to verify his/her account
 */
const staffRegisterEmail = (to, verificationlink, password) => {

    try {
        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/staff-createdemail.ejs'), 'utf-8'), {
            verificationlink: verificationlink,
            password: password,
            year: date.getFullYear(),
        });

        const data = {
            from: config.mailgun.fromemail,
            to: to,
            subject: 'Verify your Local TV Ads account',
            html: message,
        };

        mailgun.api.server.send(data, (err) => {
            if (err) {
                throw err;
            }
        });

    } catch (err) {
        logger.logError(`Failed to send staff registration email to ${to}`, err);
        throw err;
    }

};

const emailChangeVerification = (to, verificationlink) => {

    try {

        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/emailchangeverification-email.ejs'), 'utf-8'), {
            verificationlink: verificationlink,
            year: date.getFullYear(),
        });

        const data = {
            from: config.mailgun.fromemail,
            to: to,
            subject: 'Verify your new email address',
            html: message,
        };

        mailgun.api.server.send(data, (err) => {
            if (err) {
                throw err;
            }
        });

    } catch (err) {
        logger.logError(`Failed to send staff registration email to ${to}`, err);
        throw err;
    }

};

const passwordResetEmail = (to, verificationlink) => {

    try {

        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/forgotpassword-email.ejs'), 'utf-8'), {
            verificationlink: verificationlink,
            year: date.getFullYear(),
        });

        const data = {
            from: config.mailgun.fromemail,
            to: to,
            subject: 'Password Reset Link',
            html: message,
        };

        mailgun.api.server.send(data, (err) => {
            if (err) {
                throw err;
            }
        });

    } catch (err) {
        logger.logError(`Failed to send password  reset email to ${to}`, err);
        throw err;
    }

};

const paymentInvoiceEmail = (to, emailinfo) => {

    try {
        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/paymentinvoice-email.ejs'), 'utf-8'), {
            emailinfo: emailinfo,
            year: date.getFullYear(),
        });

        const data = {
            from: config.mailgun.fromemail,
            to: to,
            subject: 'Payment Invoice For Your Ad Booking',
            html: message,
        };

        mailgun.api.server.send(data, (err) => {
            if (err) {
                throw err;
            }
        });

    } catch (err) {
        logger.logError(`Failed to send payment invoice email to ${to}`, err);
        throw err;
    }

};

const addOnpaymentInvoiceEmail = (to, emailinfo) => {

    try {
        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/addon-paymentinvoice-email.ejs'), 'utf-8'), {
            emailinfo: emailinfo,
            year: date.getFullYear(),
        });

        const data = {
            from: config.mailgun.fromemail,
            to: to,
            subject: 'Payment Invoice For Your Add On Purchase',
            html: message,
        };

        mailgun.api.server.send(data, (err) => {
            if (err) {
                throw err;
            }
        });
    } catch (err) {
        logger.logError(`Failed to send payment invoice  email to ${to}`, err);
        throw err;
    }

};

const downloadReceipt = (receipt) => {

    try {
        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/transaction-receipt/transaction-receipt.ejs'), 'utf-8'), {
            receipt: receipt,
            year: date.getFullYear()
        });
        return message;
    } catch (err) {
        logger.logError(`Failed to generate receipt for ${receipt}`, err);
        throw err;
    }

};


const enquiryAdminEmail = (enquiry) => {

    try {
        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/enquiryadmin-email.ejs'), 'utf-8'), {
            client_name: enquiry.Name,
            client_email: enquiry.Email,
            client_message: enquiry.Message,
            client_subject: enquiry.Subject,
            year: date.getFullYear(),
        });

        const data = {
            from: config.mailgun.fromemail,
            to: config.mailgun.adminEmail,
            subject: '<Enquiry From:' + enquiry.Email + ' >' + enquiry.Subject,
            html: message,
        };

        mailgun.api.server.send(data, (err) => {
            if (err) {
                throw err;
            }
        });
    } catch (err) {
        logger.logError(`Failed to send enquiry alert to admin from ${enquiry.client_email}`, err);
        throw err;
    }

};



const rejectEmail = (to, text) => {
    try {
        const date = new Date();
        const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/message-rejection/message-rejection.ejs'), 'utf-8'), {
            message: text,
            year: date.getFullYear(),
        });

        const data = {
            from: config.mailgun.fromemail,
            to: to,
            subject: 'Your ad was rejected',
            html: message,
        };

        mailgun.api.server.send(data, (err) => {
            if (err) {
                throw err;
            }
        });
    } catch (err) {
        logger.logError('Failed to send rejected email to client', err);
        throw err;
    }

};

module.exports = {
    socialRegisterEmail,
    standardRegisterEmail,
    staffRegisterEmail,
    passwordResetEmail,
    emailChangeVerification,
    enquiryAdminEmail,
    paymentInvoiceEmail,
    addOnpaymentInvoiceEmail,
    downloadReceipt,
    rejectEmail
};