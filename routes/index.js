module.exports = (app, models) => {
    require('./AddOnRoutes')(app);
    require('./PortalAuthRoutes.js')(app);
    require('./ChannelProductRoutes')(app);
    require('./ClientAdPlanRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ClientRoutes')(app);
    require('./EnquiryRoutes')(app);
    require('./HealthCheckRoutes')(app);
    require('./ImageRoutes')(app);
    require('./SliderRoutes')(app);
    require('./StaffRoutes')(app);
    require('./SubscriberRoutes')(app);
    require('./TestimonialRoutes')(app);
    require('./ApiRoutes')(app, models);
};
