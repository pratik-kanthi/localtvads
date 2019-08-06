var imagemin = require('imagemin');
var imageminPngquant = require('imagemin-pngquant');
var imageminMozjpeg = require('imagemin-mozjpeg');

var googleBucket = require.main.require('./google-bucket');

/**
 * upload image to google bucket as buffer
 * @param {object} file - uploaded file in buffer
 * @param {string} destination - location of the file to be uploaded at
 * @param {string} deleteFileLocation - location of the file to be deleted from
 */
const uploadImage = (file, destination, deleteFileLocation) => {
    return new Promise((resolve, reject) => {
        imagemin.buffer(file.buffer, {
            use: [imageminPngquant(), imageminMozjpeg()]
        }).then((buffer) => {
            if (deleteFileLocation)
                googleBucket.deleteFile(deleteFileLocation);
            googleBucket.uploadFileBuffer(buffer, destination, file.mimetype).then(() => {
                resolve('Uploaded')
            }, (err) => {
                reject(err);
            });
        }, (err) => {
            console.log(err);
            reject(err);
        })
    })
};

/**
 * upload image to google bucket as buffer
 * @param {string} fileLocation - location of the file to be deleted from
 */
const deleteBucketFile = (fileLocation) => {
    return new Promise((resolve, reject) => {
        if (fileLocation) {
            googleBucket.deleteFile(fileLocation).then(() => {
                resolve('Deleted')
            }, (err) => {
                reject(err);
            });
        } else {
            reject('Invalid Location');
        }
    })
};

/**
 * upload image to google bucket as buffer
 * @param {object} file - file buffer to be uploaded
 * @param {string} destination - location of the file to be uploaded at
 * @param {string} deleteFileLocation - location of the file to be deleted from
 */
const uploadFileBuffer = (file, destination, deleteFileLocation) => {
    return new Promise((resolve, reject) => {
        if (deleteFileLocation)
            googleBucket.deleteFile(deleteFileLocation);
        googleBucket.uploadFileBuffer(file.buffer, destination, file.mimetype).then(()=> {
            resolve('Uploaded')
        }, (err) => {
            reject(err);
        });
    })
};

/**
 * upload image to google bucket as buffer
 * @param {string} source - file to be uploaded
 * @param {string} destination - location of the file to be uploaded at
 * @param {string} deleteFileLocation - location of the file to be deleted from
 */
const uploadFile = (source, destination, deleteFileLocation) => {
    return new Promise((resolve, reject) => {
        if (deleteFileLocation)
            googleBucket.deleteFile(deleteFileLocation);
        googleBucket.uploadFile(source, destination).then(() => {
            resolve('Uploaded')
        }, (err) => {
            reject(err);
        });
    });
};

module.exports = {
    uploadImage: uploadImage,
    uploadFile: uploadFile,
    uploadFileBuffer:uploadFileBuffer,
    deleteBucketFile: deleteBucketFile
};