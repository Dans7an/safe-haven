module.exports = function(app, passport, db, multer) {
var ObjectId = require('mongodb').ObjectId;
const nodemailer = require("nodemailer");

// const cloudinary = require('cloudinary').v2;
// cloudinary.config({
//   cloud_name: 'ddlqobmyw',
//   api_key: '422638137183422',
//   api_secret: '-Gq1YDQl4-kaLh7v9-8r5jncDJo'
// })


// Regex for the search
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
      if(req.query.search){
        // Fuzzy Search here
        const regex = new RegExp(escapeRegex(req.query.search), 'gi')
        // get search results
        db.collection('houses').find({name: regex}).toArray((err, result) => {
          if (err) return console.log(err)
          res.render('index.ejs', {
            user : req.user,
            messages: result
          })
        });
      } else {
        db.collection('houses').find().toArray((err, result) => {
          if (err) return console.log(err)
          res.render('index.ejs', {
            user : req.user,
            messages: result
          })
        });
      }

    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('houses').find().toArray((err, result) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            messages: result
          })
        })
    });


    // FULL VIEW OF THE HOUSE ==============================
    app.get('/fullView', function(req,res){
      console.log(req.query.house_id);
      db.collection('houses').findOne({_id: ObjectId(req.query.house_id)}, (err, result) => {
        if(err) return res.send(500, err)
        console.log(result);
        res.render('generic.ejs', {
          user: req.user,
          message: result
        })
      })
    })

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/')
    console.log("1",file);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + ".png")
        console.log("2", file);
  }
})
var upload = multer({storage: storage})
    app.post('/messages', upload.array('file-to-upload', 3), (req, res) => {
      // console.log(req.body["file-to-upload"]);
      // 'img/' +
      // const resulting = cloudinary.uploader.upload(req.files.('img/' + filename)
      console.log(req.files);
      db.collection('houses').save({
        name: req.body.name,
        msg: req.body.msg,
        rules: req.body.rules,
        description: req.body.description,
        house: req.files.map(f => 'img/' + f.filename)},
      (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })
// editing houses
    app.get('/edit/:houseId', isLoggedIn, function(req,res){
      const param = req.params.houseId
      console.log(param);
      db.collection('houses').find({_id: ObjectId(String(param))}).toArray((err, result) => {//go to collection, find specific one, place in array

        if (err) return console.log(err)// if the response is an err
        console.log(result);
        res.render('edit.ejs', {//if response is good render the profile page
          user : req.user, //results from the collection
          messages: result
        })
      })
    })
    app.post('/messages', (req, res) => {
      console.log(ObjectId(req.body.id));
      db.collection('houses')
      .findOneAndUpdate({_id: ObjectId(req.body.id)}, {
        $set: {
          thumbUp:req.body.thumbUp + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })
// for the Mailer
app.post('/sendEmail', function (req, res) {
    console.log(req.body)
    async function main() {
      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'tamara.gleason42@ethereal.email',
          pass: '6asFE7kp2A3jXJtqjB'
        }
      });
      // let singleEmailArray = []
      // if(typeof req.body.email === "string") {
      //   singleEmailArray.push(req.body.email)
      //   console.log(singleEmailArray)
      //   req.body.email = singleEmailArray
      // }
      // send mail with defined transport object
      // "${req.body.name}" <${req.body.serSendEmail}>
      let info = await transporter.sendMail({
        from: `"Fred Foo :ghost:" ${req.body.email}`,// sender address
        to: 'tamara.gleason42@ethereal.email',// list of receivers
        subject: "Hello ✔", // Subject line
        text: req.body.message, // plain text body
        // html: "<b>Hello world?</b>", // html body
      });
      console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }
    main().catch(console.error);
    res.redirect('/')
  })

  app.get('/updateHouse', isLoggedIn, (req,res) => {
    db.collection('houses').find().toArray((err,result) => {
      if(err) return console.log(err);
      res.render('profile.ejs', {
        user: req.user,
        messages: result
      })
    })
  })

  app.post('/updateHouse', upload.array('file-to-upload', 3), (req,res) => {
    console.log(req.body.ObjectId);
    db.collection('houses').update({_id: ObjectId(req.body.ObjectId)},
      {
        $set: {
          name: req.body.name,
          msg: req.body.msg,
          house: req.files.map(f => 'img/' + f.filename)
        }
      }, function(err, result){
        if(err) {
          console.log(err);
        } else {
          console.log("House updated successfully");
          res.redirect("/updateHouse")
        }
      }
  )
  })
  // deleting
    app.delete('/messages', (req, res) => {
      console.log('name', 'message', req.body.id);
      db.collection('houses').findOneAndDelete({_id: ObjectId(req.body.id)}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form for host
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // locally --------------------------------
            // LOGIN ===============================
            // show the login form
            app.get('/loginguest', function(req, res) {
                res.render('login.ejs', { message: req.flash('loginMessage') });
            });

            // process the login form
            app.post('/login', passport.authenticate('local-login', {
                successRedirect : '/profile', // redirect to the secure profile section
                failureRedirect : '/login', // redirect back to the signup page if there is an error
                failureFlash : true // allow flash messages
            }));

            // SIGNUP =================================
            // show the signup form for guest
            app.get('/guestSignup', function(req, res) {
                res.render('guestSignup.ejs', { message: req.flash('signupMessage') });
            });

            // process the signup form
            app.post('/guestSignup', passport.authenticate('local-signup', {
                successRedirect : '/profile', // redirect to the secure profile section
                failureRedirect : '/guestSignup', // redirect back to the signup page if there is an error
                failureFlash : true // allow flash messages
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
