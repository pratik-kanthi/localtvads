module.exports = {
    security: {
        tokenLife: 86400
    },
    google_bucket: {
        bucket: 'localtvads-dev-bucket',
        permissions_file_location: './google-bucket/Page9-aabff2fc558e.json',
        projectId: 'page9-cms',
        bucket_url: 'https://storage.googleapis.com/localtvads-dev-bucket/'
    },
    token:{
        secret: 'e9ine#123',
        ttl: 864000
    },
    winston:{
        log_file_location: './logger/logfile'
    },
    media:{
        image:{
            allowedExtensions: ['mp4'],
            maxSize: 20000
        }
    },
    mailgun:{
        apiKey: 'xxxxx',
        domain: 'localtvads.com',
        fromemail: 'tech@localtvads.com',
        adminEmail: 'pratik211092@gmail.com'
    },
    stripe:{
        secret: 'xxxxxxx'
    }
};
