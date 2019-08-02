const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const methodOverride = require('method-override');
const utilities = require('./utilities');

require('dotenv').config();

const app = express();
const port = process.env.PORT;
const logger = require('./logger')(app);

app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
}));
app.use(bodyParser.json({
    limit: '50mb'
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride('X-HTTP-Method-Override'));

app.use(cors());

mongoose.connect(process.env.DATABASE,{
    useNewUrlParser: true,
    useCreateIndex: true
}, (err)=> {
    if(err)
        console.log(err);
});
mongoose.Promise = global.Promise;

require('./models');


global.logger = logger;
global.utilities = utilities;

mongoose.Promise = global.Promise;

let models = require('./models')(mongoose);
require('./routes')(app,models);

app.listen(port, () => {
    console.log('Application started at PORT ' + port);
});

// require('./startup');
// require('./prototypes');

exports = module.exports = app;