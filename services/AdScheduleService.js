const AdSchedule = require.main.require('./models/AdSchedule');

const getAdSchedules = () => {
    return new Promise(async (resolve, reject) => {
        const query = { Name: 'Breakfast' };
        const projection = {
            'Name': 1
        };

        AdSchedule.find(query, projection).exec((err, schedules) => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: schedules
            });
        });
    });
};


module.exports = {
    getAdSchedules
};