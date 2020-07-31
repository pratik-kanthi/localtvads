module.exports = () => {
    return {
        serviceaddons: require('./ServiceAddOn'),
        adschedules: require('./AdSchedule'),
        channels: require('./Channel'),
        channeladschedules: require('./ChannelAdSchedule'),
        clientresources: require('./ClientResource'),
        offers: require('./Offer'),
        coupons: require('./Coupon'),
        clients: require('./Client'),
        sliders: require('./Slider'),
        testimonials: require('./Testimonial'),
        clientads: require('./ClientAd'),
        clientadplans: require('./ClientAdPlan'),
        transactions: require('./Transaction'),
        enquiries: require('./Enquiry'),
        staffs: require('./Staff'),
        subscribers: require('./Subscriber'),
        channelproducts: require('./ChannelProduct'),
        faqs: require('./FAQ'),
        taxes: require('./Tax'),
        channelslots: require('./ChannelSlot'),
        productlengths: require('./ProductLength'),
        counters: require('./Counter')
    };
};