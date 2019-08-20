const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;

const getClientAdPlan = (query, project) => {
    return new Promise(async (resolve, reject) => {
        project = project || {};
        ClientAdPlan.findOne(query, project, (err, clientAd) => {
            if(err) {
                return reject({
                    code: 500,
                    error: err
                });
            } else if(!clientAd){
                return reject({
                    code: 404,
                    error: {
                        message: utilities.ErrorMessages.NOT_FOUND
                    }
                });
            } else {
                resolve({
                    code: 200,
                    data: clientAd
                });
            }
        });
    });
};

module.exports = {
    getClientAdPlan
};