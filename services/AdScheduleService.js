const AdSchedule = require.main.require('./models/AdSchedule').model;

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

/**
 * Creates a new AdSchedule
 * @param {Object} adSchedule - object of AdSchedule model
 * @param {String} req  - ip address of the user fetched from req
 */
const saveAdSchedule = (adSchedule, req) => {
    return new Promise(async (resolve, reject) => {
        if (!adSchedule) {
            return reject({
                code: 400,
                error: {
                    message: utilities.ErrorMessages.BAD_REQUEST
                }
            });
        }
        const newAdSchedule = new AdSchedule(adSchedule);
        newAdSchedule.AuditInfo = {
            CreatedByUser: req.user._id,
            CreationDate: new Date()
        };
        newAdSchedule.save(err => {
            if (err) {
                return reject({
                    code: 500,
                    error: err
                });
            }
            resolve({
                code: 200,
                data: newAdSchedule
            });
        });
    });
};


module.exports = {
    getAdSchedules,
    saveAdSchedule
};
