module.exports = () => {
    return {
        serviceaddons: require('./ServiceAddOn'),
        adschedules: require('./AdSchedule'),
        channels: require('./Channel'),
        channeladschedules: require('./ChannelAdSchedule'),
        channelplans: require('./ChannelPlan'),
        clientresources: require('./ClientResource'),
        offers: require('./Offer'),
        coupons: require('./Coupon'),
        clients: require('./Client'),
        sliders: require('./Slider'),
        testimonials: require('./Testimonial')
    };
};
