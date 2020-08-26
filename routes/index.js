module.exports = (app, models, io) => {
    require('./AddOnRoutes')(app);
    require('./AuthRoutes')(app);
    require('./ChannelProductRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ClientAdPlanRoutes')(app, io);
    require('./ClientRoutes')(app);
    require('./EnquiryRoutes')(app);
    require('./HealthCheckRoutes')(app);
    require('./ImageRoutes')(app);
    require('./SliderRoutes')(app);
    require('./StaffRoutes')(app);
    require('./SubscriberRoutes')(app);
    require('./SubscriptionRoutes')(app);
    require('./TestimonialRoutes')(app);
    require('../web-routes')(app);
    require('./ApiRoutes')(app, models);
};