module.exports = function(app, passport, db, multer, multerS3, s3, aws) {
  var ObjectId = require('mongodb').ObjectId;
  const nodemailer = require("nodemailer");
  const fs = require("fs")

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
    if (req.query.search) {
      // Fuzzy Search here
      const regex = new RegExp(escapeRegex(req.query.search), 'gi')
      // get search results
      db.collection('houses').find({
        location: regex
      }).toArray((err, result) => {
        if (err) return console.log(err)
        res.render('index.ejs', {
          user: req.user,
          messages: result
        })
      });
    } else {
      db.collection('houses').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('index.ejs', {
          user: req.user,
          messages: result
        })
      });
    }

  });

  // PROFILE SECTION =========================
  app.get('/HostProfile', isLoggedIn, isHost, function(req, res) {
    let uid = ObjectId(req.session.passport.user)
    db.collection('houses').find({
      hostId: uid
    }).toArray((err, result) => {
       // result.forEach((item, i) => {
       //   item.house.forEach(pic => {
       //     console.log(pic);
       //     let pictureId = pic.slice(0, pic.lastIndexOf('.'));
       //     console.log(pictureId);
       //                var params = { Bucket: 'safe-havre', Key: pictureId}
       //                s3.getObject(params, function(er, data) {
       //                  if (er) return console.log(er);
       //                  fs.writeFileSync(`public/img/${pic}`, data.Body)
       //                });
       //   })
       //
       // });
      if (err) return console.log(err)
      res.render('profile.ejs', {
        user: req.user,
        messages: result
      })
    })
  });

  app.get('/guestProfile/:id', function(req, res) {
    console.log("Its me", req.params);
    db.collection('users').find({
      _id: ObjectId(req.params.id)
    }).toArray((err, result) => {
      if (err) return console.log(err)
      console.log(result);
      console.log(result[0].local);

      res.render('viewProfile.ejs', {
        // user : req.user,
        user: result[0]
      })
    })
  });

  app.get('/requestform/:id', isLoggedInAsGuest, isGuest, function(req, res) {
    console.log("Its me", req.query);
    console.log(req.query.hostId);
    db.collection('houses').find({
      _id: ObjectId(req.params.id)
    }).toArray((err, result) => {
      if (err) return console.log(err)
      res.render('request.ejs', {
        user: req.user,
        messages: result
      })
    })
  });
  // req.session.passport.user for finding out whose logged in

  //     app.get('/requestform/:id', isLoggedInAsGuest, function(req, res) {
  //     db.collection('houses').find().toArray((err, result) => {
  //       if (err) return console.log(err)
  //       res.render('request.ejs', {
  //         user : req.user,
  //         messages: result
  //       })
  //     })
  // });

  // FULL VIEW OF THE HOUSE ==============================
  app.get('/fullView', function(req, res) {
    console.log(req);
    console.log(req.query.house_id);
    db.collection('houses').findOne({
      _id: ObjectId(req.query.house_id)
    }, (err, result) => {
      if (err) return res.send(500, err)
      const hostId = result.hostId

      db.collection('users').findOne({
        _id: ObjectId(hostId)
      }, (err, hostinfo) => {
      
      res.render('generic.ejs', {
        user: req.user,
        message: result,
        hostinfo: hostinfo
      })
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
      console.log("1", file);
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + ".png")
      console.log("2", file);
    }
  })
  aws.config.region = 'us-east-2';
  var uploadS3 = multer({
    storage: multerS3({
      s3: s3,
      bucket: 'safe-havre',
      acl: 'public-read',
      metadata: function(req, file, cb) {
        cb(null, {
          fieldName: file.fieldname
        });
      },
      key: function(req, file, cb) {
        cb(null, Date.now().toString() + ".png")
      }
    })
  })
  var cpUpload = uploadS3.fields([{ name: 'thumbnail', maxCount: 1}, { name: 'secondImage', maxCount: 1 }, { name: 'thirdImage', maxCount: 1 }])

  app.post('/messages', cpUpload, (req, res) => {
    // console.log(req.body["file-to-upload"]);
    // 'img/' +
    // const resulting = cloudinary.uploader.upload(req.files.('img/' + filename)
    console.log(req.files.thumbnail[0].key);
    console.log(req.files.secondImage[0].key);
    console.log(req.files.thirdImage[0].key);
    db.collection('houses').save({
        hostId: req.user._id,
        location: req.body.location,
        space: req.body.space,
        rules: req.body.rules,
        description: req.body.description,
        Thumbnail: req.files.thumbnail[0].key,
        secondImage: req.files.secondImage[0].key,
        thirdImage: req.files.thirdImage[0].key
      },
      (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/HostProfile')
      })
  })

  app.get('/guestProfile', isGuest, function(req, res) {


    console.log(req.user._id);
    let gid = ObjectId(req.user._id)
    db.collection('requests').find({
      guestId: gid
    }).toArray((err, result) => {
      db.collection('houses').find().toArray((err, result2) => {
        if (err) return res.send(500, err)
        result = result.map(r => {
          r.house = result2.find(r2 => r2._id.toString() == r.houseId.toString())
          console.log(r);
          return r
        })
        res.render('guestProfile.ejs', {
          user: req.user,
          requests: result
        })
      })

    })
  })

  //---------------------------------------
  // Update profile picture
  //---------------------------------------
  app.post('/guestProfile', uploadS3.single('file-to-upload'), (req, res, next) => {

    insertDocuments(db, req, req.file.key, () => {
      //db.close();
      //res.json({'message': 'File uploaded successfully'});
      res.redirect('/guestProfile')
    });
  });

  var insertDocuments = function(db, req, filePath, callback) {
    var collection = db.collection('users');
    var uId = ObjectId(req.session.passport.user)
    collection.findOneAndUpdate({
      "_id": uId
    }, {
      $set: {
        profileImg: filePath
      }
    }, {
      sort: {
        _id: -1
      },
      upsert: false
    }, (err, result) => {
      if (err) return res.send(err)
      callback(result)
    })
    // collection.findOne({"_id": uId}, (err, result) => {
    //     //{'imagePath' : filePath }
    //     //assert.equal(err, null);
    //     callback(result);
    // });
  }
  //---------------------------------------
  // Update profile picture ends here
  //---------------------------------------


  app.get('/hostrequests', isHost, function(req, res) {
    let hid = ObjectId(req.session.passport.user)
    db.collection('requests').find({
      hostId: hid
    }).toArray((err, result) => {
      db.collection('houses').find({
        hostId: hid
      }).toArray((err, result2) => {
        if (err) return res.send(500, err)
        result = result.map(r => {
          console.log(r.houseId, result2[0]._id);
          r.house = result2.find(r2 => r2._id.toString() == r.houseId.toString())
          console.log(r);
          return r
        })
        res.render('hostRequests.ejs', {
          user: req.user,
          request: result
        })
      })

    })
  })


  app.post('/requests', (req, res) => {
    // console.log(req.body["file-to-upload"]);
    // 'img/' +
    // const resulting = cloudinary.uploader.upload(req.files.('img/' + filename)
    console.log(req.query.hostId);
    db.collection('requests').save({
        hostId: ObjectId(req.body.hostId),
        houseId: ObjectId(req.body.houseId),
        guestId: req.user._id,
        guestEmail: req.user.local.email,
        firstName: req.user.local.firstName,
        lastName: req.user.local.lastName,
        sex: req.user.local.sex,
        age: req.user.local.age,
        arrive: req.body.arrive,
        departure: req.body.departure,
        offering: req.body.offering,
        phoneNumber: req.body.phoneNumber,
        extraInformation: req.body.extraInformation,
        status: "pending"
      },
      (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/guestProfile')
      })
  })
  // editing houses
  app.get('/edit/:houseId', isLoggedIn, function(req, res) {
    const param = req.params.houseId
    console.log(param);
    db.collection('houses').find({
      _id: ObjectId(String(param))
    }).toArray((err, result) => { //go to collection, find specific one, place in array

      if (err) return console.log(err) // if the response is an err
      console.log(result);
      res.render('edit.ejs', { //if response is good render the profile page
        user: req.user, //results from the collection
        messages: result
      })
    })
  })
  app.post('/messages', (req, res) => {
    console.log(ObjectId(req.body.id));
    db.collection('houses')
      .findOneAndUpdate({
        _id: ObjectId(req.body.id)
      }, {
        $set: {
          thumbUp: req.body.thumbUp + 1
        }
      }, {
        sort: {
          _id: -1
        },
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })
  // for the Mailer
  app.post('/sendEmail', function(req, res) {
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

      let info = await transporter.sendMail({
        from: `"Fred Foo :ghost:" ${req.body.email}`, // sender address
        to: 'tamara.gleason42@ethereal.email', // list of receivers
        subject: "Hello ???", // Subject line
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

  app.get('/updateHouse', isLoggedIn, (req, res) => {
    db.collection('houses').find().toArray((err, result) => {
      if (err) return console.log(err);
      res.render('profile.ejs', {
        user: req.user,
        messages: result
      })
    })
  })

  app.post('/updateHouse', uploadS3.array('file-to-upload', 3), (req, res) => {
    console.log(req.body.ObjectId);
    db.collection('houses').update({
      _id: ObjectId(req.body.ObjectId)
    }, {
      $set: {
        name: req.body.name,
        msg: req.body.msg,
        house: req.files.map(f => 'img/' + f.filename)
      }
    }, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log("House updated successfully");
        res.redirect("/updateHouse")
      }
    })
  })
  //Update status
  app.put('/accepted', (req, res) => { // request to update inforamtion on the page
    db.collection('requests') // go into db collection
      .findOneAndUpdate({
        _id: ObjectId(req.body.requestId)
      }, { //find the properties and updating
        $set: { //changing whaterver property
          status: "Approved" //from the request data go to thumbup value and adding 1
        }
      }, {
        sort: {
          _id: -1
        }, //ordering the response in descending order
        upsert: true //create the object if no object/document present
      }, (err, result) => { //respond with error
        if (err) return res.send(err)
        res.send(result)
      })
  })

  app.put('/declined', (req, res) => { // request to update inforamtion on the page
    db.collection('requests') // go into db collection
      .findOneAndUpdate({
        _id: ObjectId(req.body.requestId)
      }, { //find the properties and updating
        $set: { //changing whaterver property
          status: "Declined" //from the request data go to thumbup value and adding 1
        }
      }, {
        sort: {
          _id: -1
        }, //ordering the response in descending order
        upsert: true //create the object if no object/document present
      }, (err, result) => { //respond with error
        if (err) return res.send(err)
        res.send(result)
      })
  })
  // deleting
  app.delete('/messages', (req, res) => {
    db.collection('houses').findOneAndDelete({
      _id: ObjectId(req.body.id)
    }, (err, result) => {
      if (err) return res.send(500, err)
      res.send('Message deleted!')
    })
  })
  app.delete('/requests', (req, res) => {
    console.log('requestId', req.body.requestId);
    db.collection('requests').findOneAndDelete({
      _id: ObjectId(req.body.requestId)
    }, (err, result) => {
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
  app.get('/hostLogin', function(req, res) {
    res.render('login4host.ejs', {
      message: req.flash('loginMessage'),
      page: 'hostLogin'
    });
  });

  // process the login form
  app.post('/hostLogin', passport.authenticate('local-login', {
    successRedirect: '/HostProfile', // redirect to the secure profile section
    failureRedirect: '/hostLogin', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form for host
  app.get('/hostSignup', function(req, res) {
    res.render('login4host.ejs', {
      message: req.flash('signupMessage'),
      page: 'hostSignup'
    });
  });

  // process the signup form for host
  app.post('/hostSignup', passport.authenticate('local-signup', {
    successRedirect: '/hostProfile', // redirect to the secure profile section
    failureRedirect: '/hostSignup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form for guest
  app.get('/guestLogin', function(req, res) {
    res.render('guestSignup.ejs', {
      message: req.flash('loginMessage'),
      page: 'guestLogin'
    });
  });

  // process the login form
  app.post('/guestLogin', passport.authenticate('local-login', {
    successRedirect: '/guestProfile', // redirect to the secure profile section
    failureRedirect: '/guestLogin', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form for guest
  app.get('/guestSignup', function(req, res) {
    res.render('guestSignup.ejs', {
      message: req.flash('signupMessage'),
      page: 'guestSignup'
    });
  });

  // process the signup form
  app.post('/guestSignup', passport.authenticate('local-signup', {
    successRedirect: '/guestProfile', // redirect to the secure profile section
    failureRedirect: '/guestSignup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function(req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function(err) {
      res.redirect('/HostProfile');
    });
  });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/hostLogin');
}
// route middleware to ensure user is logged in
function isLoggedInAsGuest(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/guestLogin');
}

function isHost(req, res, next) {
  if (req.user.local.userType == 'host')
    return next();
  res.redirect('/hostLogin');
}

function isGuest(req, res, next) {
  console.log(req);
  if (req.user.local.userType == 'guest')
    return next();
  res.redirect('/guestLogin');
}
// function redirectPage(req, res){
//   console.log('hello 123');
//   if(req.route.path === '/fullView'){
//     console.log('hello');
//     res.redirect('/fullView')
//   } else{
//     console.log('456');
//     res.redirect('/guestProfile')
//   }
// }
