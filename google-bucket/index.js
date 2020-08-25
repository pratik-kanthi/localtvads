/* eslint no-console: 0 */
const config = require('../config');
const conf = {
    projectId: config.google_bucket.projectId,
    keyFilename: config.google_bucket.permissions_file_location
};
const {Storage} = require('@google-cloud/storage');
const storage = new Storage(conf);

const bucket = storage.bucket(config.google_bucket.bucket);

const getAllFiles = () => {
    return new Promise((resolve, reject) => {
        bucket
            .getFiles()
            .then((results) => {
                resolve(results);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

const getAllFilesByPrefix = (prefix, delimiter) => {
    return new Promise( (resolve, reject) => {
        const options = {
            prefix: prefix,
        };

        if (delimiter) {
            options.delimiter = delimiter;
        }

        // Lists files in the bucket, filtered by a prefix
        bucket
            .getFiles(options)
            .then((results) => {
                resolve(results);
            })
            .catch((err) => {
                reject(err);
            });
    });
};


const uploadFileBuffer = (buffer, filename, mimetype) => {
    return new Promise((resolve, reject) => {
        const file = bucket.file(filename);

        const stream = file.createWriteStream({
            metadata: {
                contentType: mimetype
            }
        });

        stream.on('error', (err) => {
            logger.logError(err);
            reject(err);
        });

        stream.on('finish', () => {
            file.makePublic().then(() => {
                logger.logDebug('Uploaded');
                resolve('Uploaded');
            }, function (err) {
                reject(err);
                logger.logError(err);
            });
        });
        stream.end(buffer);
    });
};

const uploadFile = (source, destination) => {
    return new Promise((resolve, reject) => {
        bucket.upload(source, {
            destination: destination
        })
            .then(() => {
                const file = bucket.file(destination);
                file.makePublic().then(() => {
                    console.log('Uploaded');
                    resolve('Uploaded');
                }, (err) => {
                    reject(err);
                    logger.logError(err);
                });
            })
            .catch((err) => {
                logger.logError(err);
                reject('ERROR:', err);
            });
    });
};

const downloadFile = (srcFilename, destFilename) => {
    return new Promise((resolve, reject) => {
        const options = {
            destination: destFilename,
        };

        bucket
            .file(srcFilename)
            .download(options)
            .then(() => {
                resolve(
                    'gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.'
                );
            })
            .catch((err) => {
                reject('ERROR:', err);
            });
    });
};

const deleteFile = (filename) => {
    return new Promise((resolve, reject) => {

        bucket
            .file(filename)
            .delete()
            .then(() => {
                console.log('Deleted');
                resolve('Deleted.');
            })
            .catch((err) => {
                console.log('Delete Error');
                logger.logError(err);
                reject('ERROR:', err);
            });
    });
};

const getMetadata = (filename) => {
    return new Promise((resolve, reject) => {
        bucket
            .file(filename)
            .getMetadata()
            .then((results) => {
                const metadata = results[0];
                resolve(metadata);
            })
            .catch((err) => {
                reject('ERROR:', err);
            });
    });
};

const makePublic = (filename) => {
    return new Promise((resolve, reject) => {
        bucket
            .file(filename)
            .makePublic()
            .then(() => {
                resolve('gs://${bucketName}/${filename} is now public.');
            })
            .catch((err) => {
                reject(err);
            });
    });
};

const generateSignedUrl = (filename) => {
    return new Promise((resolve, reject) => {
        // These options will allow temporary read access to the file
        const options = {
            action: 'read',
            expires: '03-17-2025',
        };

        // Get a signed URL for the file
        bucket
            .file(filename)
            .getSignedUrl(options)
            .then((results) => {
                resolve(results);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

const moveFile = (srcFilename, destFilename) => {
    return new Promise((resolve, reject) => {
        bucket
            .file(srcFilename)
            .move(destFilename)
            .then(() => {
                resolve('gs://${bucketName}/${srcFilename} moved to gs://${bucketName}/${destFilename}.');
            })
            .catch((err) => {
                reject(err);
            });
    });
};

const copyFile = (srcBucketName, srcFilename, destBucketName, destFilename) => {
    return new Promise((resolve, reject) => {
        storage
            .bucket(srcBucketName)
            .file(srcFilename)
            .copy(storage.bucket(destBucketName).file(destFilename))
            .then(() => {
                console.log('gs://${srcBucketName}/${srcFilename} copied to gs://${destBucketName}/${destFilename}.');
                resolve();
            })
            .catch(err => {
                logger.logError(err);
                return reject(err);
            });
    });
};
module.exports = {
    getAllFiles,
    getAllFilesByPrefix,
    uploadFile,
    uploadFileBuffer,
    downloadFile,
    deleteFile,
    getMetadata,
    makePublic,
    generateSignedUrl,
    moveFile,
    copyFile
};
