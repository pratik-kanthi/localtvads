/* eslint no-console: 0 */
const socketIO = require('socket.io');
const http = require('http');
const config = require.main.require('./config');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');

const socketPort = process.env.SOCKETPORT;

const {updateClientAd} = require.main.require('./services/ClientAdService');
const {uploadVideoForAddOns} = require.main.require('./services/AddOnService');

module.exports = () => {
    const app = http.createServer();
    const io = socketIO(app, {
        origins: '*:*',
        wsEngine: 'ws',
        pingInterval: 10000,
        pingTimeout: 5000
    });

    app.listen(socketPort, () => {
        console.log('Socket started on port ' + socketPort);
    });

    io.use((socket, next) => {
        authenticateSocket(socket, next);
    }).on('connection', (socket) => {

        socket.on('UPLOAD_CHUNK', async (data) => {
            const tempDir = './public/uploads/' + data.client + '/Temp';
            const extension = data.name.substr(data.name.lastIndexOf('.'));
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, {recursive: true});
            }

            let fd;
            try {
                fd = await fs.open(tempDir + '/' + Date.now() + extension, 'a', 0o755);
            } catch (err) {
                logger.logError(err);
                socket.emit('UPLOAD_ERROR');
            }
            try {
                await fs.write(fd, data.data, null, 'Binary');
                fs.close(fd);
            } catch (err) {
                logger.logError(err);
                socket.emit('UPLOAD_ERROR');
                return;
            }
            if (data.isLast) {
                const uploadDir = './public/uploads/' + data.client + '/Video/';
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, {recursive: true});
                }
                const outputFile = fs.createWriteStream(path.join(uploadDir, Date.now() + extension));
                let filenames;
                try {
                    filenames = await fs.readdir(tempDir);
                } catch (err) {
                    logger.logError(err);
                    socket.emit('UPLOAD_ERROR');
                    return;
                }
                filenames.forEach(async(tempName) => {
                    const data = fs.readFileSync(`${tempDir}/${tempName}`);

                    try {
                        await outputFile.write(data);
                    } catch (err) {
                        logger.logError(err);
                        socket.emit('UPLOAD_ERROR');
                        return;
                    }

                    try {
                        fs.removeSync(`${tempDir}/${tempName}`);
                    } catch (err) {
                        logger.logError(err);
                        socket.emit('UPLOAD_ERROR');
                    }
                });

                outputFile.end();

                outputFile.on('finish', async () => {
                    fs.removeSync(tempDir);
                    socket.emit('UPLOAD_FINISHED');
                    updateClientAd(data.clientAdPlan, outputFile.path, extension, socket);
                });
            } else {
                socket.emit('UPLOAD_CHUNK_FINISHED', data.sequence);
            }
        });

        socket.on('UPLOAD_RESOURCE_CHUNK', async (data) => {
            const tempDir = './public/uploads/' + data.client + '/Temp';
            const extension = data.name.substr(data.name.lastIndexOf('.'));
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, {recursive: true});
            }

            let fd;
            try {
                fd = await fs.open(tempDir + '/' + Date.now() + extension, 'a', 0o755);
            } catch (err) {
                logger.logError(err);
                socket.emit('UPLOAD_ERROR');
            }
            try {
                await fs.write(fd, data.data, null, 'Binary');
                fs.close(fd);
            } catch (err) {
                logger.logError(err);
                socket.emit('UPLOAD_ERROR');
                return;
            }
            if (data.isLast) {
                const uploadDir = './public/uploads/' + data.client + '/Video/';
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, {recursive: true});
                }
                const outputFile = fs.createWriteStream(path.join(uploadDir, Date.now() + extension));
                let filenames;
                try {
                    filenames = await fs.readdir(tempDir);
                } catch (err) {
                    logger.logError(err);
                    socket.emit('UPLOAD_ERROR');
                    return;
                }
                filenames.forEach(async(tempName) => {
                    const data = fs.readFileSync(`${tempDir}/${tempName}`);

                    try {
                        await outputFile.write(data);
                    } catch (err) {
                        logger.logError(err);
                        socket.emit('UPLOAD_ERROR');
                        return;
                    }

                    try {
                        fs.removeSync(`${tempDir}/${tempName}`);
                    } catch (err) {
                        logger.logError(err);
                        socket.emit('UPLOAD_ERROR');
                    }
                });

                outputFile.end();

                outputFile.on('finish', async () => {
                    try {
                        await uploadVideoForAddOns(data, outputFile.path, extension, socket);
                        fs.removeSync(tempDir);
                    } catch (err) {
                        logger.logError(err);
                    }
                });
            } else {
                socket.emit('UPLOAD_CHUNK_FINISHED', data.sequence);
            }
        });
    });

    const authenticateSocket = (socket, next) => {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(socket.handshake.query.token, config.token.secret, (err, decoded) => {
                if (err) {
                    return next(new Error('Authentication error'));
                }
                socket.decoded = decoded;
                next();
            });
        } else {
            logger.logDebug('Authentication Error while connecting to sockets', socket.handshake.query.token);
            next(new Error('Authentication error'));
        }
    };
    return {
        io
    };
};
