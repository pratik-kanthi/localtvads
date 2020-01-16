const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const Transaction = require.main.require('./models/Transaction').model;

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
            BookedDate: 1
        };

        const populateOptions = [{
            path: 'Client',
            select: {
                Name: 1,
            }
        },
        {
            path: 'ClientAd',
            select: {
                Status: 1,
                Length: 1,
                Date: 1
            },
            match: {
                Status: 'UNDERREVIEW'
            }

        },
        {
            path: 'ChannelPlan.Plan.Channel',
            model: 'Channel',
            select: {
                Name: 1,
                Description: 1
            }
        },
        {
            path: 'ChannelPlan.Plan.ChannelAdSchedule',
            model: 'ChannelAdSchedule',
            select: {
                _id: 1
            },
            populate: [{
                path: 'AdSchedule',
                model: 'AdSchedule',
                select: {
                    Name: 1,
                    Description: 1,
                    StartTime: 1,
                    EndTime: 1
                }
            }]
        }, {
            path: 'ChannelPlan.AuditInfo',
        }
        ];

        ClientAdPlan.find({}, projection).sort('-BookedDate').populate(populateOptions).exec((err, caps) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }

            const res = caps.filter(cap => {
                return cap.ClientAd != null && cap.Client != null;
            }).slice(0, 5);

            resolve({
                code: 200,
                data: res
            });
        });
    });
};

const fetchMetricsByDate = () => {
    return new Promise(async (resolve, reject) => {
        const startdate = new Date();
        const enddate = new Date();

        startdate.setMonth(startdate.getMonth() - 1);

        Transaction.find({
            DateTime: {
                $gt: startdate,
                $lt: enddate
            }
        }).countDocuments((err, metricCount) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }

            resolve({
                code: 200,
                data: metricCount
            });
        });
    });
};

module.exports = {
    fetchDashboardAds,
    fetchMetricsByDate
};