const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const videoshow = require('videoshow');

const makeVideo = (images, audio, options, client) => {
    return new Promise(async (resolve, reject) => {
        let ad = videoshow(images, options);
        if (audio) {
            ad.audio(audio);
        }
        let date = Date.now();
        let outputPath = 'uploads/' + client + '/Previews/' + date + '.mp4';
        let pathPrefix = './public/uploads/' + client + '/Previews';
        if (!fs.existsSync(pathPrefix)) {
            fs.mkdirSync(pathPrefix, {recursive: true});
        }
        let fullPath = path.join(pathPrefix + '/' + date + '.mp4');
        ad.save(fullPath)
            .on('error', async (err, stdout, stderr) => {
                return reject({
                    code: 500,
                    error: err
                });
            })
            .on('end', async (output) => {
                return resolve(outputPath);
            });
    });
};

const getFFMPEGImageObject = (img, destination) => {
    return {
        path: destination,
        loop: img.Time,
        caption: img.Caption,
        transitionColor: img.TransitionColor,
        transitionDuration: img.TransitionDuration,
        filters: img.Filters,
        disableFadeOut: img.DisableFadeOut,
        disableFadeIn: img.DisableFadeIn,
        captionDelay: img.CaptionDelay,
        captionStart: img.CaptionStart,
        captionEnd: img.CaptionEnd
    }
};

const getFFMPEGMetaData = (path) => {
    return new Promise(async (resolve, reject) => {
        ffmpeg.ffprobe(path, (err, metadata) => {
            if (err) {
                return reject(err);
            }
            resolve(metadata);
        });
    });
};

module.exports = {
    makeVideo,
    getFFMPEGImageObject,
    getFFMPEGMetaData
};

