module.exports = (app) => {
    require('./AuthRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ClientAdRoutes')(app);
    require('./ClientRoutes')(app);
    require('./ResourceRoutes')(app);
};