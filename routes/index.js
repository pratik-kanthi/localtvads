module.exports = (app, models, io) => {
    require('./AuthRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ClientAdRoutes')(app, io);
    require('./ClientRoutes')(app);
    require('./ResourceRoutes')(app);
};