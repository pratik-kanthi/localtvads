module.exports = (app) => {
    require('./AuthRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ResourceRoutes')(app);
};