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
};

/**
 *
 * @param {String} to - email address of the registered user
 * @param {String} verificationlink - verification link to mailed to the user to verify his/her account
 */
const standardRegisterEmail = (to, verificationlink) => {
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
};

/**
 *
 * @param {String} to - email address of the registered user
 * @param {String} verificationlink - verification link to mailed to the user to verify his/her account
 */
const staffRegisterEmail = (to, verificationlink, password) => {
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
};

const emailChangeVerification = (to, verificationlink) => {
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
};

const passwordResetEmail = (to, verificationlink) => {
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
};

const paymentInvoiceEmail = (to, emailinfo) => {
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
};

const addOnpaymentInvoiceEmail = (to, emailinfo) => {
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
};

const downloadReceipt = (receipt) => {
    const date = new Date();
    const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/transaction-receipt/transaction-receipt.ejs'), 'utf-8'), {
        receipt: receipt,
        year: date.getFullYear()
    });
    return message;
};

const updateClientAdEmail = (to, videolink, emailinfo) => {
    const date = new Date();
    const message = ejs.render(fs.readFileSync(path.join(__dirname, '..', '/email/templates/updateclientad-email.ejs'), 'utf-8'), {
        client_name: emailinfo.client_name,
        client_email: emailinfo.client_email,
        booking_date: emailinfo.booking_date,
        channel: emailinfo.channel,
        slot: emailinfo.slot,
        start_date: emailinfo.start_date,
        end_date: emailinfo.end_date,
        ad_length: emailinfo.ad_length,
        videolink: videolink,
        year: date.getFullYear(),
    });

    const data = {
        from: config.mailgun.fromemail,
        to: config.mailgun.adminEmail,
        subject: 'New ad booking',
        html: message,
    };

    mailgun.api.server.send(data, (err) => {
        if (err) {
            throw err;
        }
    });
};

const enquiryAdminEmail = (enquiry) => {
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
};

module.exports = {
    socialRegisterEmail,
    standardRegisterEmail,
    staffRegisterEmail,
    passwordResetEmail,
    emailChangeVerification,
    updateClientAdEmail,
    enquiryAdminEmail,
    paymentInvoiceEmail,
    addOnpaymentInvoiceEmail,
    downloadReceipt,
};