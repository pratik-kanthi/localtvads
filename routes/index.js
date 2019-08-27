module.exports = (app) => {
    require('./AuthRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ClientAdRoutes')(app);
    require('./ResourceRoutes')(app);
};