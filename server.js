/* eslint no-console: 0 */
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const os = require('os');
const path = require('path');
const cors = require('cors');
const methodOverride = require('method-override');
const utilities = require('./utilities');

require('dotenv').config();

const app = express();
const port = process.env.PORT;
require('./middlewares');

app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: '50mb',
    })
);

app.use(
    bodyParser.json({
        limit: '50mb',
    })
);

app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(cors());

global.logger = require('./logger')(app);
global._host = os.hostname();
global.utilities = utilities;

mongoose.Promise = global.Promise;
mongoose.connect(
    process.env.DATABASE, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
    },
    (err) => {
        if (err) {
            logger.logError('Error in connection MongoDb', err);
        } else {

            // const models = require('./models')(mongoose);
            // const io = require('./sockets')();

            // require('./routes')(app, models, io);
            require('./web-routes')(app);
            require('./web-hooks')(app);
            require('./prototypes');

            app.listen(port, () => {
                logger.logInfo('Application started at PORT ' + port);
                console.log('Application started at PORT ' + port);
            });

        }
    }
);

exports = module.exports = app;
