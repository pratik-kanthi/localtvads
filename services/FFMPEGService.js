const fs = require('fs-extra');
const path = require('path');

const config = require.main.require('./config');

const ClientAd = require.main.require('./models/ClientAd').model;
const Transaction = require.main.require('./models/Transaction').model;

const {getClientAdPlan} = require.main.require('./services/AdService');
const {uploadFile, downloadFile} = require.main.require('./services/FileService');
const {makeVideo, getFFMPEGImageObject, getFFMPEGMetaData} = require.main.require('./ffmpeg');

/**
 * Save a custom video already uploaded in the public folder
 * @param {Object} clientAd (optional) - document of clientAd
 */
const saveCustomVideo = (clientAd) => {
    return new Promise(async (resolve, reject) => {
        if (!clientAd) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        let query = {
            _id: clientAd
        };
        ClientAd.findOne(query, async(err, cAd) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            else if (!cAd) {
                return reject({
                    code: 404,
                    error: {
                        message: 'Ad ' + utilities.ErrorMessages.NOT_FOUND
                    }
                });
            }

            try {
                let info = await getFFMPEGMetaData('./public/' + cAd.PreviewUrl);
                cAd.Length = info.streams[0].duration;
            } catch (ex) {
                return reject({
                    code: 500,
                    error: ex
                });
            }

            let time = Date.now();

            let dst = 'uploads/Client/' + cAd.Client.toString() + '/Ads/' + time + '.mp4';
            try {
                let result = await uploadFile('public/' + cAd.PreviewUrl, dst);
            } catch (ex) {
                return reject({
                    code: 500,
                    error: ex
                });
            }
            cAd.VideoUrl = dst;
            cAd.Status = 'UNDERREVIEW';
            let tempPreviewUrl = cAd.PreviewUrl;
            cAd.PreviewUrl = undefined;
            cAd.PreviewDate = undefined;
            cAd.save(err => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }
                resolve({
                    code: 200,
                    data: cAd
                });
                try {
                    fs.removeSync('public/' + tempPreviewUrl);
                } catch (ex) {
                    logger.logError(ex);
                }
            });
        });
    });
};

/**
 * Generate a custom video through uploaded pictures and media
 * @param {Array} pictures - Array of objects of pictures
 * @param {Object} audio (optional) - Audio object
 * @param {string} clientAd (optional) - _id of clientAd document
 */
const previewCustomVideo = (pictures, audio, clientAd) => {
    return new Promise(async (resolve, reject) => {
        if (!pictures || !pictures.length) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }

        let badObj = pictures.find(pic => !pic.ResourceUrl || !pic.Time || !pic.Client);
        if (badObj) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        let ffmpegPictures = [];
        let pathPrefix = './public/uploads/' + pictures[0].Client;
        if (!fs.existsSync(pathPrefix)) {
            fs.mkdirSync(pathPrefix + '/Resources', {recursive: true});
        }
        let downloadedFiles = pictures.map(pic => {
            let source = config.google_bucket.bucket_url + pic.ResourceUrl;
            let destination = path.join(pathPrefix + '/Resources/' + pic.ResourceUrl.substr(pic.ResourceUrl.lastIndexOf('/') + 1));
            let ffmpegPic = getFFMPEGImageObject(pic, destination);
            ffmpegPictures.push(ffmpegPic);
            try {
                return downloadFile(source, destination);
            } catch (ex) {
                return reject({
                    code: 500,
                    error: ex
                })
            }
        });

        if (audio) {
            let source = config.google_bucket.bucket_url + audio.ResourceUrl;
            let destination = path.join(pathPrefix + '/Resources/' + audio.ResourceUrl.substr(audio.ResourceUrl.lastIndexOf('/') + 1));
            downloadedFiles.push(downloadFile(source, destination));
            audio = destination;
        }

        try {
            let result = await Promise.all(downloadedFiles);
        } catch (ex) {
            return reject({
                code: 500,
                error: ex
            });
        }

        let video;
        try {
            video = await makeVideo(ffmpegPictures, audio, {
                loop: 5,
                transition: true,
                transitionDuration: 1,
                captionDelay: 1000,
                useSubRipSubtitles: false,
                subtitleStyle: null,
                videoBitrate: 1024,
                videoCodec: 'libx264',
                size: '640x?',
                audioBitrate: '128k',
                audioChannels: 2,
                format: 'mp4'
            }, pictures[0].Client);
        } catch (ex) {
            return reject({
                code: ex.code || 500,
                error: ex.error || ex
            });
        }

        let queue = ffmpegPictures.map((pic) => {
            return fs.removeSync(pic.path);
        });

        if (audio) {
            queue.push(fs.removeSync(audio));
        }

        try {
            let result = await Promise.all(queue);
        } catch (ex) {
            return reject({
                code: 500,
                error: ex
            });
        }
        if (clientAd) {
            ClientAd.findOne({_id: clientAd}, (err, cAd) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                } else if (!cAd) {
                    return reject({
                        code: 404,
                        error: {
                            message: 'Video Ad' + utilities.ErrorMessages.NOT_FOUND
                        }
                    });
                } else {
                    cAd.Status = 'DRAFT';
                    if (cAd.PreviewUrl) {
                        try {
                            fs.removeSync('public/' + cAd.PreviewUrl);
                        } catch (ex) {
                            return reject({
                                code: 500,
                                error: ex
                            });
                        }
                    }
                    cAd.PreviewUrl = video;
                    cAd.save(err => {
                        if (err) {
                            return reject({
                                code: 500,
                                error: err

                            })
                        }
                        resolve({
                            code: 200,
                            data: cAd
                        });
                    });
                }
            });
        } else {
            let cAd = new ClientAd({
                Client: pictures[0].Client,
                Status: 'DRAFT',
                PreviewUrl: video,
                PreviewDate: new Date()
            });
            cAd.save(err => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err

                    })
                }
                resolve({
                    code: 200,
                    data: cAd
                });
            });
        }
    });
};

const generateFilters = (filters, imagePaths) => {
    return imagePaths.map((img) => {
        return __dirname + '/../' + img
    });
};


module.exports = {
    saveCustomVideo,
    previewCustomVideo
};