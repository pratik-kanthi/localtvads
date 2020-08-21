const config = require.main.require('./config');
const stripe = require('stripe')(config.stripe.secret);
const Client = require.main.require('./models/Client').model;
const ClientAdPlan = require.main.require('./models/ClientAdPlan').model;
const ChannelProduct = require.main.require('./models/ChannelProduct').model;
const ServiceAddOn = require.main.require('./models/ServiceAddOn').model;
const ClientPaymentMethod = require.main.require('./models/ClientPaymentMethod').model;
const Transaction = require.main.require('./models/Transaction').model;

const {
    getAllTaxes
} = require.main.require('./services/TaxService');

const saveSubscription = (cplan, newCard, savedCard) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!cplan) {
                return reject({
                    code: 500,
                    error: {
                        message: utilities.ErrorMessages.BAD_REQUEST,
                    },
                });
            }

            let paymentSource = null,
                isNewCustomer, customer, product, subscriptionPrice, addonsPrice;

            if (newCard) {
                //save new card
                const cardObj = new ClientPaymentMethod({
                    Client: cplan.Client,
                    IsPreferred: true,
                    StripeCardToken: newCard.id,
                    Card: {
                        PaymentMethodType: 'CARD',
                        Vendor: newCard.card.brand,
                        Name: newCard.CardName,
                        ExpiryMonth: newCard.card.exp_month,
                        ExpiryYear: newCard.card.exp_year,
                        LastFour: newCard.card.last4,
                    },
                });
                try {
                    paymentSource = await cardObj.save();
                } catch (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
            } else if (savedCard) {
                paymentSource = await ClientPaymentMethod.findOne({
                    _id: savedCard,
                });
            }

            Client.findOne({
                _id: cplan.Client,
            }).exec(async (err, client) => {
                if (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }

                if (!client.StripeCustomerId) {
                    customer = (await stripe.customers.create({
                        payment_method: paymentSource.StripeCardToken,
                        name: client.Name,
                        email: client.Email,
                    })).id;
                    isNewCustomer = true;
                } else {
                    customer = client.StripeCustomerId;
                    if (newCard) {
                        try {
                            await stripe.paymentMethods.attach(
                                paymentSource.StripeCardToken, {
                                    customer: client.StripeCustomerId
                                }
                            );
                        } catch (err) {
                            return reject({
                                code: 500,
                                error: err
                            });

                        }
                    }
                }

                //product
                product = await stripe.products.create({
                    name: cplan.Name || 'PLAN_FOR_' + client.Name,
                    active: true,
                });

                //generate plan
                const clientAdPlan = await _generateClientAdPlan(cplan);

                //create prices
                subscriptionPrice = await stripe.prices.create({
                    unit_amount: clientAdPlan.WeeklyAmount.toFixed(2) * 100,
                    currency: 'gbp',
                    recurring: {
                        interval: 'week',
                    },
                    product: product.id,
                });

                addonsPrice = await stripe.prices.create({
                    unit_amount: clientAdPlan.AddonsAmount.toFixed(2) * 100,
                    currency: 'gbp',
                    product: product.id,
                });


                const taxes = (await getAllTaxes()).data;
                const stripeTaxIds = taxes.map(tax => {
                    return tax.StripeTaxId;
                });


                //create subscription
                const subscription = await stripe.subscriptions.create({
                    customer: customer,
                    default_payment_method: paymentSource.StripeCardToken,
                    items: [{
                        price: subscriptionPrice.id,
                    }, ],
                    add_invoice_items: [{
                        price: addonsPrice.id,
                    }, ],
                    default_tax_rates: stripeTaxIds
                });

                clientAdPlan.Status = 'PAID';
                clientAdPlan.StripeReferenceId = subscription.id;
                clientAdPlan.PaymentMethod = paymentSource._id;

                try {
                    await clientAdPlan.save();
                } catch (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }

                if (isNewCustomer) {
                    try {
                        client.StripeCustomerId = customer;
                        await client.save();
                    } catch (err) {
                        return reject({
                            code: 500,
                            error: err,
                        });
                    }
                }

                try {
                    const transaction = new Transaction({
                        ClientAdPlan: clientAdPlan._id,
                        Client: clientAdPlan.Client,
                        Amount: (clientAdPlan.totalAmount - clientAdPlan.taxAmount).toFixed(2),
                        TaxAmount: clientAdPlan.taxAmount.toFixed(2),
                        TaxBreakdown: clientAdPlan.Taxes,
                        TotalAmount: clientAdPlan.totalAmount.toFixed(2),
                        Status: 'SUCCEEDED',
                        StripeResponse: subscription,
                        ReferenceId: subscription.id,
                    });

                    await transaction.save();
                    resolve({
                        code: 200,
                        data: transaction
                    });
                } catch (err) {
                    return reject({
                        code: 500,
                        error: err,
                    });
                }
            });
        } catch (err) {
            return reject({
                code: 500,
                error: err,
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
        clientAdPlan.taxAmount = taxAmount;
        clientAdPlan.totalAmount = taxAmount + clientAdPlan.WeeklyAmount + clientAdPlan.AddonsAmount;
        resolve(clientAdPlan);
    });
};

module.exports = {
    saveSubscription,
};