module.exports = (app) => {
    require('./AuthRoutes')(app);
    require('./ChannelRoutes')(app);
    require('./ChannelProductRoutes')(app);
    require('./AddOnRoutes')(app);
    require('./TaxRoutes')(app);
    require('./ClientResourceRoutes')(app);
    require('./ClientAdPlanRoutes')(app);
    require('./PaymentRoutes')(app);
    require('./ProfileRoutes')(app);
    require('./ContactRoutes')(app);
    require('./TransactionRoutes')(app);
};