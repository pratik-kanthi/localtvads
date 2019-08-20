module.exports = (app,models) => {
    require('./AuthRoutes')(app);
    require('./FFMPEGRoutes')(app);
    require('./ClientResourceRoutes')(app);
};