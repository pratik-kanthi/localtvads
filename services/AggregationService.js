const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
// const ClientAd = require.main.require('./models/ClientAd').model;


const fetchAdsByChannels = () => {
    return new Promise(async (resolve, reject) => {
        const query = {};
        const project = {
            'ChannelPlanPlan.Channel': 1,
            'ClientAd': 1
        };
        const populateOptions = [
            {
                path: 'ClientAd',
            },
            {
                path: 'ChannelPlan.Plan.Channel',
                model: 'Channel',
                select: {
                    Name: 1,
                }
            }
        ];

        ClientAdPlan.find(query, project).populate(populateOptions).exec((err, clientAdPlans) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            const adsbychannels = {};

            clientAdPlans.map(cap => {
                const cid = cap.ChannelPlan.Plan.Channel.Name;

                if (adsbychannels[cid]) {
                    if (cap.ClientAd) {
                        adsbychannels[cid]++;
                    }
                } else {
                    adsbychannels[cid] = 0;
                    if (cap.ClientAd) {
                        adsbychannels[cid]++;
                    }
                }

                return cap;
            });

            resolve({
                code: 200,
                data: adsbychannels
            });
        });
    });
};

module.exports = {
    fetchAdsByChannels
};