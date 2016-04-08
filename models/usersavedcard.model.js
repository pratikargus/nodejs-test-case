'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
        Schema = mongoose.Schema;

var UserSavedCard = new Schema({
    savedCustomerId: String,
    isArchive: {type: Boolean, default: false},
    userId: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

var userSavedCards = mongoose.model('UserSavedCards', UserSavedCard);

module.exports = userSavedCards;
