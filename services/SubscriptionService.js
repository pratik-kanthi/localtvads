const config = require.main.require('./config');
const stripe = require('stripe')(
    config.stripe.secret
);
const Client = require.main.require('./models/Client').model;
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ChannelProduct = require.main.require('./models/ChannelProduct').model;
const ServiceAddOn = require.main.require('./models/ServiceAddOn').model;
const {
    getAllTaxes
} = require.main.require('./services/TaxService');

const saveSubscription = (cplan, payment_method, ) => {
    return new Promise(async (resolve, reject) => {
        try {

            if (!cplan || !payment_method) {
                return reject({
                    code: 500,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST
                    }
                });
            }


            let isNewCustomer = false,
                customer, product, subscriptionPrice, addonsPrice;




            Client.findOne({
                _id: cplan.Client
            }).exec(async (err, client) => {

                if (err) {
                    return reject({
                        code: 500,
                        error: err
                    });
                }

                if (!client.StripeCustomerId) {
                    customer = await stripe.customers.create({
                        email: client.Email,
                        payment_method: payment_method.paymentMethod.id,
                        invoice_settings: {
                            default_payment_method: payment_method.paymentMethod.id,
                        },
                    });
                    isNewCustomer = true;
                } else {
                    customer = client.StripeCustomerId;
                }

                //product
                product = await stripe.products.create({
                    name: cplan.Name,
                    active: true,
                });


                //get prices
                const clientAdPlan = await _generateClientAdPlan(cplan);

                //create prices
                subscriptionPrice = await stripe.prices.create({
                    unit_amount: clientAdPlan.WeeklyAmount * 100,
                    currency: 'gbp',
                    recurring: {
                        interval: 'week'
                    },
                    product: product.id,
                });

                addonsPrice = await stripe.prices.create({
                    unit_amount: clientAdPlan.AddonsAmount * 100,
                    currency: 'gbp',
                    product: product.id,
                });


                //create subscription
                const subscription = await stripe.subscriptions.create({
                    customer: customer.id,
                    items: [{
                        price: subscriptionPrice.id,
                    }],
                    add_invoice_items: [{
                        price: addonsPrice.id,
                    }],
                });


                clientAdPlan.Status = 'PAID';
                clientAdPlan.save((err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                    if (isNewCustomer) {
                        client.StripeCustomerId = customer.id;
                        client.save((err) => {
                            if (err) {
                                return reject({
                                    code: 500,
                                    error: err
                                });
                            }
                            resolve({
                                code: 200,
                                data: clientAdPlan,
                            });
                        });
                    }
                });
            });


        } catch (err) {
            return reject({
                code: 500,
                error: err
            });
        }
    });
};

const _generateClientAdPlan = (cPlan) => {
    return new Promise(async (resolve) => {
        const clientAdPlan = new ClientAdPlan({
            Name: cPlan.Name,
            VAT: cPlan.VAT,
            Client: cPlan.Client,
            Channel: cPlan.Channel,
            Days: cPlan.Days,
            WeeklyAmount: 0,
            AddonsAmount: 0,
            BillingAddress: cPlan.BillingAddress,
        });
        const channelProduct = await ChannelProduct.findOne({
            _id: cPlan.ChannelProduct,
        })
            .deepPopulate('ProductLength ChannelSlots.Slot')
            .lean()
            .exec();
        const channelSlots = channelProduct.ChannelSlots.filter((item) => {
            return cPlan.ChannelSlots.indexOf(item.Slot._id.toString()) != -1;
        });
        clientAdPlan.ChannelProduct = {
            ProductLength: channelProduct.ProductLength,
            ChannelSlots: channelSlots,
        };
        for (let i = 0, len = channelSlots.length; i < len; i++) {
            clientAdPlan.WeeklyAmount += channelSlots[i].RatePerSecond * channelSlots[i].Duration * clientAdPlan.Days.length;
        }
        if (cPlan.Addons && cPlan.Addons.length > 0) {
            const addon = await ServiceAddOn.findOne({
                _id: cPlan.Addons[0],
            })
                .lean()
                .exec();
            clientAdPlan.AddonsAmount = addon.Amount;
            clientAdPlan.Addons = [addon];
        }
        let taxAmount = 0;
        const taxes = (await getAllTaxes()).data;
        for (let i = 0, len = taxes.length; i < len; i++) {
            if (taxes[i].Type === 'FIXED') {
                taxAmount += taxes[i].Value;
            } else {
                taxAmount += taxes[i].Value * 0.01 * (clientAdPlan.WeeklyAmount + clientAdPlan.AddonsAmount);
            }
        }
        clientAdPlan.Taxes = taxes;
        const totalAmount = taxAmount + clientAdPlan.WeeklyAmount + clientAdPlan.AddonsAmount;
        resolve(clientAdPlan);

    });
};

module.exports = {
    saveSubscription
};