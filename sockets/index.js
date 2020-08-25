/* eslint no-console: 0 */
const socketIO = require('socket.io');
const http = require('http');
const config = require.main.require('./config');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');
const socketPort = process.env.SOCKETPORT;
const {
    saveClientVideo,
} = require.main.require('./services/ResourceService');
const {
    uploadFile
} = require.main.require('./services/FileService');
module.exports = () => {
    const app = http.createServer();
    const io = socketIO(app, {
        origins: '*:*',
        wsEngine: 'ws',
        pingInterval: 10000,
        pingTimeout: 5000,
    });
    app.listen(socketPort, () => {
        logger.logDebug('Socket started on port ' + socketPort);
    });
    io.use((socket, next) => {
        authenticateSocket(socket, next);
    }).on('connection', (socket) => {
        socket.on('UPLOAD_CHUNK', async (data) => {
            try {
                const tempDir = path.join(__dirname, '..', '/public/uploads/' + data.client + '/Temp');
                const extension = data.name.substr(data.name.lastIndexOf('.'));
                fs.ensureDirSync(tempDir);
                const fd = await fs.open(tempDir + '/' + Date.now() + extension, 'a', 0o755);
                fs.writeSync(fd, data.data, null, 'Binary');
                fs.close(fd);
                if (data.isLast) {
                    const uploadDir = './public/uploads/' + data.client + '/Video/';
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, {
                            recursive: true
                        });
                    }
                    const outputFile = fs.createWriteStream(path.join(uploadDir, Date.now() + extension));
                    const filenames = await fs.readdir(tempDir);
                    filenames.forEach(async (tempName) => {
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
                        }
                    });
                    outputFile.end();
                    outputFile.on('finish', async () => {
                        try {
                            const dst = 'uploads/Client/' + data.client + '/assets/' + Date.now() + extension;
                            await uploadFile(outputFile.path, dst);
                            fs.removeSync(tempDir);
                            socket.emit('UPLOAD_FINISHED');
                            saveClientVideo(data.client, dst, extension, socket);
                        } catch (ex) {
                            socket.emit('UPLOAD_ERROR');
                        }
                    });
                } else {
                    socket.emit('UPLOAD_CHUNK_FINISHED', data.sequence);
                }
            } catch (err) {
                logger.logError(err);
                socket.emit('UPLOAD_ERROR');
                return;
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
        io,
    };
};