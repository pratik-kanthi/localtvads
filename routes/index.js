module.exports = (app, models, io) => {
    require('./AuthRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ClientAdRoutes')(app, io);
    require('./ClientRoutes')(app);
    require('./ContactRoutes')(app);
    require('./ImageRoutes')(app);
    require('./ResourceRoutes')(app);
};