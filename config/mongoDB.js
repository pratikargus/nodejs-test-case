'use strict';

var mongoose = require( 'mongoose' );
var config = require( './index.js' );
console.log(process.env)
console.log(process.env.dbPath )
mongoose.connect( process.env.dbPath );
