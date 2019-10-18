module.exports = () => {
    return {
        serviceaddons: require('./ServiceAddOn'),
        adschedules: require('./AdSchedule'),
        adchannels: require('./Channel'),
        channeladschedules: require('./ChannelAdSchedule'),
        channelplans: require('./ChannelPlan'),
        clientresources: require('./ClientResource')
    };
};
