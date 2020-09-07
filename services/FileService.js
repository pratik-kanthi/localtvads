const request = require('request');

const googleBucket = require.main.require('./google-bucket');
const fs = require('fs');
/**
 * upload image to google bucket as buffer
 * @param {string} fileLocation - location of the file to be deleted from
 */
const deleteBucketFile = (fileLocation) => {
    return new Promise((resolve, reject) => {
        try {
            if (fileLocation) {
                googleBucket.deleteFile(fileLocation).then(() => {
                    resolve('Deleted');
                }, (err) => {
                    logger.logError('Failed to delete bucket file');
                    reject(err);
                });
            } else {
                logger.logWarning('Invalid bucket location');
                reject('Invalid Location');
            }
        } catch (err) {
            logger.logError('Failed to delete bucket file');
            reject(err);
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
        try {
            request({
                url: source,
                method: 'GET',
                encoding: null
            }).pipe(fs.createWriteStream(destination))
                .on('close', () => {
                    resolve(destination);
                })
                .on('error', (err) => {
                    logger.logError('Failed to download bucket file');
                    reject(err);
                });
        } catch (err) {
            logger.logError('Failed to download bucket file');
            reject(err);
        }

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
        try {
            if (deleteFileLocation) {
                googleBucket.deleteFile(deleteFileLocation);
            }
            googleBucket.uploadFileBuffer(file.buffer, destination, file.mimetype).then(() => {
                resolve('Uploaded');
            }, (err) => {
                logger.logError('Failed to upload bucket file buffer');
                reject(err);
            });
        } catch (err) {
            logger.logError('Failed to upload bucket file buffer');
            reject(err);
        }
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
        try {
            if (deleteFileLocation) {
                googleBucket.deleteFile(deleteFileLocation);
            }
            googleBucket.uploadFile(source, destination).then(() => {
                resolve('Uploaded');
            }, (err) => {
                logger.logError('Failed to upload bucket file');
                reject(err);
            });
        } catch (err) {
            logger.logError('Failed to upload bucket file');
            reject(err);
        }

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

        try {
            if (deleteFileLocation) {
                googleBucket.deleteFile(deleteFileLocation);
            }
            googleBucket.uploadFileBuffer(file.buffer, destination, file.mimetype).then(() => {
                resolve('Uploaded');
            }, (err) => {
                logger.logError('Failed to upload image');
                reject(err);
            });
        } catch (err) {
            logger.logError('Failed to upload image');
            reject(err);
        }

    });
};

module.exports = {
    uploadImage,
    uploadFile,
    uploadFileBuffer,
    deleteBucketFile,
    downloadFile
};