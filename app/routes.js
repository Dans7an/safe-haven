module.exports = function(app, passport, db, multer) {
var ObjectId = require('mongodb').ObjectId;

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
      console.log(req.files);
      db.collection('houses').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0, house: req.files.map(f => 'img/' + f.filename)}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

    app.put('/messages', (req, res) => {
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
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
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
