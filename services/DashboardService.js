const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const Transaction = require.main.require('./models/Transaction').model;
const Client = require.main.require('./models/Client').model;
const Channel = require.main.require('./models/Channel').model;

const fetchDashboardAds = () => {
    return new Promise(async (resolve, reject) => {
        const projection = {
            Name: 1,
            Client: 1,
            ClientAd: 1,
            StartDate: 1,
            DayOfWeek: 1,
            ChannelPlan: 1,
            Status: 1,
            BookedDate: 1,
        };

        const populateOptions = [
            {
                path: 'Client',
                select: {
                    Name: 1,
                },
            },
            {
                path: 'ClientAd',
                select: {
                    Status: 1,
                    Length: 1,
                    Date: 1,
                },
                match: {
                    Status: 'UNDERREVIEW',
                },
            },
            {
                path: 'ChannelPlan.Plan.Channel',
                model: 'Channel',
                select: {
                    Name: 1,
                    Description: 1,
                },
            },
            {
                path: 'ChannelPlan.Plan.ChannelAdSchedule',
                model: 'ChannelAdSchedule',
                select: {
                    _id: 1,
                },
                populate: [
                    {
                        path: 'AdSchedule',
                        model: 'AdSchedule',
                        select: {
                            Name: 1,
                            Description: 1,
                            StartTime: 1,
                            EndTime: 1,
                        },
                    },
                ],
            },
            {
                path: 'ChannelPlan.AuditInfo',
            },
        ];

        ClientAdPlan.find({}, projection)
            .sort('-BookedDate')
            .populate(populateOptions)
            .exec((err, caps) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }

                const res = caps
                    .filter((cap) => {
                        return cap.ClientAd != null && cap.Client != null;
                    })
                    .slice(0, 5);

                resolve({
                    code: 200,
                    data: res,
                });
            });
    });
};

/**
 * Fetch Metrics for Dashboard - (new and total) ads, channels, users, transactions
 *
 * @param {String} startDate
 * @param {String} endDate
 */
const fetchInsights = (startDate, endDate) => {
    return new Promise(async (resolve, reject) => {
        if (!startDate || !endDate) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST,
                },
            });
        } else {
            const result = {};
            let query, countQuery, filterCount, totalCount;

            /*------ Ads ---------------------------------*/
            query = ClientAdPlan.countDocuments({
                ClientAd: {
                    $ne: null,
                },
                BookedDate: {
                    $gte: startDate,
                    $lte: endDate,
                },
            });
            countQuery = ClientAdPlan.countDocuments({
                ClientAd: {
                    $ne: null,
                },
            });
            filterCount = await query.exec();
            totalCount = await countQuery.exec();
            result.ads = {
                filtered: filterCount,
                total: totalCount,
            };

            /*---------- Users ---------------------------*/

            query = Client.countDocuments({
                DateCreated: {
                    $gte: startDate,
                    $lte: endDate,
                },
            });
            countQuery = Client.countDocuments({});
            filterCount = await query.exec();
            totalCount = await countQuery.exec();
            result.clients = {
                filtered: filterCount,
                total: totalCount,
            };

            /*------- Channels -----------------------------*/

            query = Channel.countDocuments({
                Status: 'LIVE',
            });
            countQuery = Channel.countDocuments();

            filterCount = await query.exec();
            totalCount = await countQuery.exec();

            result.channels = {
                active: filterCount,
                total: totalCount,
            };

            /*-------- Transactions ------------------------*/

            query = Transaction.countDocuments({
                DateTime: {
                    $gte: startDate,
                    $lte: endDate,
                },
            });
            countQuery = Transaction.countDocuments();

            filterCount = await query.exec();
            totalCount = await countQuery.exec();

            result.transactions = {
                filtered: filterCount,
                total: totalCount,
            };

            resolve({
                code: 200,
                data: result,
            });
        }
    });
};

const fetchAdsByChannels = () => {
    return new Promise(async (resolve, reject) => {
        const query = {};
        const project = {
            'ChannelPlanPlan.Channel': 1,
            ClientAd: 1,
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
                },
            },
        ];

        ClientAdPlan.find(query, project)
            .populate(populateOptions)
            .exec((err, clientAdPlans) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
                const adsbychannels = {};

                clientAdPlans.map((cap) => {
                    if (cap.ChannelPlan.Plan.Channel) {
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
                    }
                    return cap;
                });

                resolve({
                    code: 200,
                    data: adsbychannels,
                });
            });
    });
};

module.exports = {
    fetchDashboardAds,
    fetchInsights,
    fetchAdsByChannels,
};
