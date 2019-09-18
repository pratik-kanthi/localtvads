const request = require('request');

const googleBucket = require.main.require('./google-bucket');
const fs = require('fs');

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
    });
};

/**
 * upload image to google bucket as buffer
 * @param {string} source - file to be downloaded from
 * @param {string} destination - file to be downloaded to
 */
const downloadFile = (source, destination) => {
    return new Promise(async (resolve, reject) => {
        request({
            url: source,
            method: 'GET',
            encoding: null
        }).pipe(fs.createWriteStream(destination))
            .on('close', ()=> {
                resolve(destination);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
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
    });
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

/**
 * upload image to google bucket as buffer
 * @param {object} file - uploaded file in buffer
 * @param {string} destination - location of the file to be uploaded at
 * @param {string} deleteFileLocation - location of the file to be deleted from
 */
const uploadImage = (file, destination, deleteFileLocation) => {
    return new Promise((resolve, reject) => {
        if (deleteFileLocation)
            googleBucket.deleteFile(deleteFileLocation);
        googleBucket.uploadFileBuffer(file.buffer, destination, file.mimetype).then(() => {
            resolve('Uploaded')
        }, (err) => {
            reject(err);
        });
    });
};

module.exports = {
    uploadImage,
    uploadFile,
    uploadFileBuffer,
    deleteBucketFile,
    downloadFile
};