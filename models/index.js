module.exports = () => {
    return {
        clientserviceaddons: require('./ServiceAddOn'),
        channels: require('./Channel'),
        clientresources: require('./ClientResource'),
        clients: require('./Client'),
        sliders: require('./Slider'),
        testimonials: require('./Testimonial'),
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