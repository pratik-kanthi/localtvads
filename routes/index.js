module.exports = (app, models, io) => {
    require('./AddOnRoutes')(app);
    require('./AuthRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ClientAdRoutes')(app, io);
    require('./ClientRoutes')(app);
    require('./ContactRoutes')(app);
    require('./ImageRoutes')(app);
    require('./OfferRoutes')(app);
    require('./ResourceRoutes')(app);
    require('./ApiRoutes')(app, models);
};
