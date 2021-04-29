// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
const MongoClient = require('mongodb').MongoClient
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');
var multer = require('multer');
const nodemailer = require("nodemailer");
var db
//S3 packages
var aws = require('aws-sdk');
var multerS3 = require('multer-s3');
var configAWS = require('./config/aws.js');
var s3 = new aws.S3(configAWS);

require("dotenv").config({ path: "./config/.env" });
//req.body["file-to-upload"]
// cloudinary cloud service for images
// const cloudinary = require('cloudinary').v2;
// cloudinary.config({
//   cloud_name: 'ddlqobmyw',
//   api_key: '422638137183422',
//   api_secret: '-Gq1YDQl4-kaLh7v9-8r5jncDJo'
// })

// configuration ===============================================================
mongoose.connect(process.env.mongoUrl, (err, database) => {
  if (err) return console.log(err)
  db = database
  require('./app/routes.js')(app, passport, db, multer, multerS3, s3, aws);
}); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: 'rcbootcamp2019a', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
