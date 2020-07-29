module.exports = (app) => {
    require('./ClientResourceRoutes')(app);
    require('./ClientAdPlanRoutes')(app);
};
