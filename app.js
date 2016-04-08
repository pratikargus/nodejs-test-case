'use strict';

var express = require( 'express' );
var path = require( 'path' );
//var favicon = require('serve-favicon');
var logger = require( 'morgan' );
var cookieParser = require( 'cookie-parser' );
var bodyParser = require( 'body-parser' );
var expressLayouts = require( 'express-ejs-layouts' );
var jwt = require( 'jsonwebtoken' );
var config = require( './config' );

var routes = require( './routes/index' );
var users = require( './routes/users' );
var util = require('util');

var app = express();

// view engine setup
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'ejs' );

app.set( 'layout', 'layout' );

//secret jwt
app.set( 'superSecret', config.secret ); // secret variable

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use( logger( 'dev' ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( {
    extended: false
} ) );
app.use( cookieParser() );
app.use( express.static( path.join( __dirname, 'public' ) ) );
app.use( expressLayouts );

var mongoDB = require( './config/mongoDB.js' );



app.use( '/', routes );
app.use( '/users', users );

// catch 404 and forward to error handler
app.use( function( req, res, next ) {
    var err = new Error( 'Not Found' );
    err.status = 404;
    next( err );
} );

// error handlers

// development error handler
// will print stacktrace
if ( app.get( 'env' ) === 'development' ) {
    app.use( function( err, req, res, next ) {
        res.status( err.status || 500 );
        res.render( 'error', {
            message: err.message,
            error: err
        } );
        console.error(util.format('Uncaught Exception:- %s', err.stack === undefined ? err : err.stack));
    } );
}

// production error handler
// no stacktraces leaked to user
app.use( function( err, req, res, next ) {
    res.status( err.status || 500 );
    res.render( 'error', {
        message: err.message,
        error: {}
    } );
    console.error(util.format('Uncaught Exception:- %s', err.stack === undefined ? err : err.stack));
} );



module.exports = app;
