'use strict';

var Transactions = require('../models/transactions.model.js');
var UserSavedCards = require('../models/usersavedcard.model.js');
var config = require('../config');
var Stripe = require('stripe')( process.env.stripeApiKey);

exports.index = function(req, res, next) {
    if (req.body) {
        var transaction = new Transactions({
            name: req.body.name
        });
        transaction.save(function(err, trans) {
            if (err) {
                return console.log(err);
            }
            res.status(200).end();
        });
    }
};

exports.createTransaction = function(req, res, next) {

    //Charge amount
    var chargeCredit = function(customerId, source, amount, currency, description) {
        return Stripe.charges.create({
            amount: amount,
            currency: currency,
            customer: customerId,
            source: source,
            description: description
        });
    };

    //Save transaction in db
    var saveTransaction = function(charge) {
        var transaction = new Transactions({
            transactionId: charge.id,
            amount: charge.amount,
            created: charge.created,
            currency: charge.currency,
            description: charge.description,
            paid: charge.paid,
            sourceId: charge.source.id
        });
        transaction.save(function(err) {
            if (err) {
                return res.status(500);
            }
            else {
                return res.status(200).json({
                    message: 'Payment is created.'
                });
            }
        });
    };

    UserSavedCards.findOne({userId: req.decoded._doc._id}, function(err, result) {
        if (err) {
            return res.status(500);
        } else {
            if (result && result.savedCustomerId) {
                //if existing card for existing customer.
                if (!req.body.cardId) {
                    Stripe.customers.createSource(result.savedCustomerId, {source: req.body.stripeToken}, function(err, card) {
                        if (err) {
                            console.log(err);
                            return res.status(500).json({
                                message: err.message
                            });
                        }
                        chargeCredit(result.savedCustomerId, card.id, req.body.amount, req.body.currency, 'Charge for test@example.com')
                                .then(saveTransaction, function(err) {
                                    console.log(err);
                                    return res.status(500).json({
                                        message: err.message
                                    });
                                });
                    });
                } else {
                    //new card for existing customer
                    chargeCredit(result.savedCustomerId, req.body.cardId, req.body.amount, req.body.currency, 'Charge for test@example.com')
                            .then(saveTransaction, function(err) {
                                console.log(err);
                                return res.status(500).json({
                                    message: err.message
                                });
                            });
                }
            } else {
                //New card for new customer
                Stripe.customers.create({
                    source: req.body.stripeToken,
                    description: 'payinguser@example.com'
                }).then(function(customer) {
                    return chargeCredit(customer.id, customer.default_source, req.body.amount, req.body.currency, 'Charge for test@example.com');
                }, function(err) {
                    console.log(err);
                    return res.status(500);
                }).then(function(charge) {
                    if (req.decoded._doc._id) {
                        var savedCard = new UserSavedCards({
                            userId: req.decoded._doc._id,
                            savedCustomerId: charge.source.customer
                        });
                        savedCard.save(function(err) {
                            if (err) {
                                return res.status(500);
                            } else {
                                saveTransaction(charge);
                            }
                        });
                    }
                }, function(err) {
                    console.log(err);
                    return res.status(500).json({
                        message: err.message
                    });
                });
            }
        }
    });
};


exports.retrieveSavedCards = function(req, res, next) {
    if (req.decoded._doc._id) {
        UserSavedCards.find({userId: req.decoded._doc._id}, function(err, result) {
            if (err) {
                return res.status(500);
            } else {
                if (result.length > 0) {
                    Stripe.customers.listCards(result[0].savedCustomerId, function(err, response) {
                        if (err) {
                            console.log(err);
                            return res.status(500).json({
                                message: err.message
                            });
                        }
                        var data = [];
                        if (response && response.data && response.data.length > 0) {
                            for (var i = 0; i < response.data.length; i++) {
                                data.push({
                                    cardId: response.data[i].id,
                                    brand: response.data[i].brand,
                                    exp_month: response.data[i].exp_month,
                                    exp_year: response.data[i].exp_year,
                                    last4: response.data[i].last4,
                                    funding: response.data[i].funding
                                });
                            }
                        }
                        return res.status(200).json({
                            data: data
                        });
                    });
                } else {
                    return res.status(200).json({
                        message: result
                    });
                }
            }
        });
    }
};
