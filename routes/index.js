module.exports = (app, models, io) => {
    require('./AdScheduleRoutes')(app);
    require('./SliderRoutes')(app);
    require('./TestimonialRoutes')(app);
    require('./AddOnRoutes')(app);
    require('./AuthRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ClientAdRoutes')(app, io);
    require('./ClientRoutes')(app);
    require('./ContactRoutes')(app);
    require('./ImageRoutes')(app);
    require('./OfferRoutes')(app);
    require('./ResourceRoutes')(app);
    require('./StaffRoutes')(app);
    require('./ApiRoutes')(app, models);
};
