var config = require('../config');
var conf = {
    projectId: config.google_bucket.projectId,
    keyFilename: config.google_bucket.permissions_file_location
};
const {Storage} = require('@google-cloud/storage');
const storage = new Storage(conf);

var bucket = storage.bucket(config.google_bucket.bucket);

function getAllFiles() {
    return new Promise(function (resolve, reject) {
        bucket
            .getFiles()
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

function getAllFilesByPrefix(prefix, delimiter) {

    // The prefix by which to filter files, e.g. "public/"
    // const prefix = "public/";

    // The delimiter to use, e.g. "/"
    // const delimiter = "/";

    // Instantiates a client
    /**
     * This can be used to list all blobs in a "folder", e.g. "public/".
     *
     * The delimiter argument can be used to restrict the results to only the
     * "files" in the given "folder". Without the delimiter, the entire tree under
     * the prefix is returned. For example, given these blobs:
     *
     *   /a/1.txt
     *   /a/b/2.txt
     *
     * If you just specify prefix = '/a', you'll get back:
     *
     *   /a/1.txt
     *   /a/b/2.txt
     *
     * However, if you specify prefix='/a' and delimiter='/', you'll get back:
     *
     *   /a/1.txt
     */
    return new Promise(function (resolve, reject) {
        const options = {
            prefix: prefix,
        };

        if (delimiter) {
            options.delimiter = delimiter;
        }

        // Lists files in the bucket, filtered by a prefix
        bucket
            .getFiles(options)
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}


function uploadFileBuffer(buffer, filename, mimetype) {
    return new Promise(function (resolve, reject) {
        //create a file in the bucket
        const file = bucket.file(filename);

        //create a write stream to write image buffer to the data
        const stream = file.createWriteStream({
            metadata: {
                contentType: mimetype
            }
        });

        stream.on('error', (err) => {
            console.log(err);
            reject(err);
        });

        stream.on('finish', () => {
            //make the file public
            file.makePublic().then(function () {
                console.log('Uploaded');
                resolve('Uploaded')
            }, function (err) {
                reject(err);
                console.log(err);
            });
        });
        stream.end(buffer);
    })
}

function uploadFile(source, destination) {
    // const filename = "./local/path/to/file.txt";
    // Uploads a local file to the bucket
    return new Promise(function (resolve, reject) {
        bucket.upload(source, {
            destination: destination
        })
            .then(function () {
                const file = bucket.file(destination);
                file.makePublic().then(function () {
                    console.log('Uploaded');
                    resolve('Uploaded')
                }, function (err) {
                    reject(err);
                    console.log(err);
                });
            })
            .catch(function (err) {
                console.log(err)
                reject('ERROR:', err);
            });
    });
}

function downloadFile(srcFilename, destFilename) {
    // const srcFilename = "file.txt";
    // const destFilename = "./local/path/to/file.txt";
    return new Promise(function (resolve, reject) {
        const options = {
            destination: destFilename,
        };

        // Downloads the file
        bucket
            .file(srcFilename)
            .download(options)
            .then(function () {
                resolve(
                    'gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.'
                );
            })
            .catch(function (err) {
                reject('ERROR:', err);
            });
    });
}

function deleteFile(filename) {
    return new Promise(function (resolve, reject) {

        bucket
            .file(filename)
            .delete()
            .then(function () {
                console.log('Deleted');
                resolve('Deleted.');
            })
            .catch(function (err) {
                console.log('Delete Error');
                console.log(err);
                reject('ERROR:', err);
            });
    });
}

function getMetadata(filename) {
    return new Promise(function (resolve, reject) {

        bucket
            .file(filename)
            .getMetadata()
            .then(function (results) {
                const metadata = results[0];
                resolve(metadata);
                // console.log('File: ${metadata.name}');
                // console.log('Bucket: ${metadata.bucket}');
                // console.log('Storage class: ${metadata.storageClass}');
                // console.log('Self link: ${metadata.selfLink}');
                // console.log('ID: ${metadata.id}');
                // console.log('Size: ${metadata.size}');
                // console.log('Updated: ${metadata.updated}');
                // console.log('Generation: ${metadata.generation}');
                // console.log('Metageneration: ${metadata.metageneration}');
                // console.log('Etag: ${metadata.etag}');
                // console.log('Owner: ${metadata.owner}');
                // console.log('Component count: ${metadata.component_count}');
                // console.log('Crc32c: ${metadata.crc32c}');
                // console.log('md5Hash: ${metadata.md5Hash}');
                // console.log('Cache-control: ${metadata.cacheControl}');
                // console.log('Content-type: ${metadata.contentType}');
                // console.log('Content-disposition: ${metadata.contentDisposition}');
                // console.log('Content-encoding: ${metadata.contentEncoding}');
                // console.log('Content-language: ${metadata.contentLanguage}');
                // console.log('Metadata: ${metadata.metadata}');
                // console.log('Media link: ${metadata.mediaLink}');
            })
            .catch(function (err) {
                reject('ERROR:', err);
            });
    });
}

function makePublic(filename) {
    return new Promise(function (resolve, reject) {
        bucket
            .file(filename)
            .makePublic()
            .then(function () {
                resolve('gs://${bucketName}/${filename} is now public.');
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

function generateSignedUrl(filename) {
    return new Promise(function (resolve, reject) {
        // These options will allow temporary read access to the file
        const options = {
            action: 'read',
            expires: '03-17-2025',
        };

        // Get a signed URL for the file
        bucket
            .file(filename)
            .getSignedUrl(options)
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

function moveFile(srcFilename, destFilename) {

    // The destination path for the file, e.g. "moved.txt"
    // const destFilename = "moved.txt";
    return new Promise(function (resolve, reject) {
        bucket
            .file(srcFilename)
            .move(destFilename)
            .then(function () {
                resolve('gs://${bucketName}/${srcFilename} moved to gs://${bucketName}/${destFilename}.');
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

function copyFile(srcBucketName, srcFilename, destBucketName, destFilename) {
    return new Promise(function (resolve, reject) {
        // The name of the source file, e.g. "file.txt"
        // const srcFilename = "file.txt";

        // The destination bucket, e.g. "my-other-bucket"
        // const destBucketName = "my-other-bucket";

        // The destination filename, e.g. "file.txt"
        // const destFilename = "file.txt";
        storage
            .bucket(srcBucketName)
            .file(srcFilename)
            .copy(storage.bucket(destBucketName).file(destFilename))
            .then(() => {
                console.log('gs://${srcBucketName}/${srcFilename} copied to gs://${destBucketName}/${destFilename}.');
            })
            .catch(err => {
                console.error('ERROR:', err);
            });
    });
}
module.exports = {
    getAllFiles: getAllFiles,
    getAllFilesByPrefix: getAllFilesByPrefix,
    uploadFile: uploadFile,
    uploadFileBuffer: uploadFileBuffer,
    downloadFile: downloadFile,
    deleteFile: deleteFile,
    getMetadata: getMetadata,
    makePublic: makePublic,
    generateSignedUrl: generateSignedUrl,
    moveFile: moveFile,
    copyFile: copyFile,
}