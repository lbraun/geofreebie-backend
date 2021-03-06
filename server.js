var mongoose = require("mongoose");
var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");

var User = require("./user");
var Review = require("./review");
var Datapoint = require("./datapoint");

var recording = true;

var app = express();
app.use(bodyParser.json({limit: "50mb"}));
app.use(cors());

var mongodbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/test";

mongoose.connect(
  mongodbUri,
  { useNewUrlParser: true }
);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// Method to add datapoints from user updates
function addUserUpdateDatapoint(_userId, updatedAttributes) {
  User.findById(_userId, function(err, user) {
    if (err) {
      console.log(err.message);
    } else {
      if (user) {
        for (var key in updatedAttributes) {
          if (key == "updatedAt") { continue; }
          if (updatedAttributes.hasOwnProperty(key)) {
            var oldValue = user[key];
            var newValue = updatedAttributes[key];

            recordDatapoint({
              _userId: _userId,
              coords: updatedAttributes.coords || user.coords,
              action: `Updated ${key} from ${oldValue} to ${newValue}`,
            });
          }
        }
      } else {
        recordDatapoint({
          _userId: _userId,
          coords: updatedAttributes.coords,
          action: `Created user with attributes ${updatedAttributes}`,
        });
      }
    }
  });
}

// Method to record datapoints of all kinds
function recordDatapoint(data) {
  var datapoint = new Datapoint(data);

  datapoint.save(function (err, datapoint) {
    if (err) return console.error(err);
  });
}


// *****************
// * API ENDPOINTS *
// *****************

var router = express.Router();

// Middleware to use for all requests
router.use(function(req, res, next) {
    console.log("\n>>>>> " + req.method + " " + req.originalUrl);
    console.log(">>>>> body: " + JSON.stringify(req.body));
    console.log(">>>>> params: " + JSON.stringify(req.params));
    next(); // Make sure we go to the next routes and don't stop here
});

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

// USERS API ROUTES BELOW

// Routes that end in /users
// ----------------------------------------------------
router.route('/users')

  // Find all users
  .get(function(req, res) {
    var fields = {
      approved: true,
      contactInformation: true,
      coords: true,
      family_name: true,
      gender: true,
      given_name: true,
      hasCompletedConsentForm: true,
      hasCompletedDemographicSurvey: true,
      hasCompletedLsnsSurvey: true,
      locale: true,
      loginsCount: true,
      name: true,
      newlyCreated: true,
      nickname: true,
      offer: true,
      offersCompleted: true,
      picture: true,
      shareLocation: true,
      useLocation: true,
    };

    User.find({}, fields, function(err, users) {
        if (err) {
          handleError(res, err.message, "Failed to get users.");
        } else {
          for (var i = users.length - 1; i >= 0; i--) {
            if (users[i].offer.picture) {
              users[i].offer.picture = true;
            }
          }
          res.status(200).json(users);
        }
    })
  })

  // Find or create a new user based on auth0 user info
  .post(function(req, res) {
    var user = req.body;

    if (!user.auth0Id) {
      handleError(res, "Invalid user input", "Must provide an auth0Id.", 400);
    } else {
      // Check if user exists
      User.findOne({ auth0Id: user.auth0Id }, function(err, existingUser) {
        if (err) {
          handleError(res, err.message, "Failed to check if user exists.");
        } else {
          if (existingUser) {
            // User exists, so return it
            res.status(200).json({ _id: existingUser.id });
          } else {
            // User doesn't exsist in database yet, so create it
            var newUser = new User(user);
            newUser.newlyCreated = true;

            newUser.save(function(err) {
              if (err) {
                handleError(res, err.message, "Failed to create new user.");
              } else {
                res.status(201).json({ _id: newUser.id });
              }
            });
          }
        }
      });
    }
  });


// Routes that end in /offer_pictures/:user_id
// ----------------------------------------------------
router.route("/offer_pictures/:user_id")

  // Find an offer photo by user id
  .get(function(req, res) {
    User.findById(req.params.user_id, function(err, user) {
      if (err) {
        handleError(res, err.message, "Failed to get user.");
      } else {
        if (user.offer.picture) {
          var img = new Buffer(user.offer.picture, 'base64');
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
          });
          res.end(img);
        }
      }
    });
  });


// Routes that end in /users/:user_id
// ----------------------------------------------------
router.route("/users/:user_id")

  // Find a user by id
  .get(function(req, res) {
    User.findById(req.params.user_id, function(err, user) {
      if (err) {
        handleError(res, err.message, "Failed to get user.");
      } else {
        res.status(200).json(user);
      }
    });
  })

  // Update a user by id
  .put(function(req, res) {
    User.findById(req.params.user_id, function(err, user) {
      if (err) {
        handleError(res, err.message, "Failed to get user for updating.");
      } else {
        if (!user) {
          handleError(res, "Invalid user id", "User not found", 404);
        } else {
          // Don't update picture if user is just sending our URI back to us
          if (user.pictureFormat == "uri") {
            delete user.picture;
          }

          var whitelistedAttributes = {
            "approved":                      false,
            "auth0Id":                       false,
            "contactInformation":            true,
            "coords":                        true,
            "demographicSurvey":             true,
            "family_name":                   true,
            "gender":                        true,
            "given_name":                    true,
            "hasCompletedConsentForm":       true,
            "hasCompletedDemographicSurvey": true,
            "hasCompletedLsnsSurvey":        true,
            "locale":                        true,
            "loginsCount":                   true,
            "lsnsSurvey":                    true,
            "name":                          true,
            "newlyCreated":                  true,
            "nickname":                      true,
            "offer":                         true,
            "offersCompleted":               true,
            "picture":                       true,
            "shareLocation":                 true,
            "useLocation":                   true,
          };

          for (var attribute in req.body) {
            if (whitelistedAttributes[attribute]) {
              user[attribute] = req.body[attribute];
            } else {
              console.log("Trying to update non-whitelisted attribute " + attribute);
            }
          }

          if (recording) {
            addUserUpdateDatapoint(req.params.user_id, req.body);
          }

          user.save(function(err) {
            if (err) {
              handleError(res, err.message, "Failed to update user.");
            } else {
              res.status(201).json({ _id: user.id });
            }
          });
        }
      }
    });
  });


// Routes that end in /pendingReviews
// ----------------------------------------------------
router.route("/pendingReviews")

  // Create a new review for a given user
  .post(function(req, res) {
    var review = req.body;

    if (!review.offerTitle) {
      handleError(res, "Invalid review input", "Must provide an offerTitle.", 400);
    } else {
      User.findById(review._userId, function(err, user) {
        if (err) {
          console.log(err.message);
        } else {
          if (user) {
            var newReview = new Review({
              _userId: user.id,
              userType: review.userType,
              offerTitle: review.offerTitle,
              status: "pending",
            });

            if (review.userType == "recipient") {
              newReview._otherUserId = review._otherUserId;
            }

            newReview.save(function(err) {
              if (err) {
                handleError(res, err.message, "Failed to create new review.");
              } else {
                res.status(201).json({ _id: newReview.id });
              }
            });
          } else {
            handleError(res, "Invalid review input", "Must provide a valid _userId.", 400);
          }
        }
      });
    }
  })

  // Find reviews by user
  .get(function(req, res) {
    var _userId = req.query._userId;

    Review.find({status: "pending", _userId: _userId}, function(err, reviews) {
      if (err) {
        handleError(res, err.message, "Failed to get reviews.");
      } else {
        res.status(200).json(reviews);
      }
    });
  })


// Routes that end in /pendingReviews/:review_id
// ----------------------------------------------------
router.route("/pendingReviews/:review_id")

  // Update a review by id
  .put(function(req, res) {
    Review.findById(req.params.review_id, function(err, review) {
      if (err) {
        handleError(res, err.message, "Failed to get review for updating.");
      } else {
        if (!review) {
          handleError(res, "Invalid review id", "Review not found", 404);
        }

        var whitelistedAttributes = {
          "_userId":            false,
          "_otherUserId":       true,
          "offerTitle":         true,
          "question1":          true,
          "question2":          true,
          "question3":          true,
          "question4":          true,
          "status":             true,
          "dateSubmitted":      true,
        };

        for (var attribute in req.body) {
          if (whitelistedAttributes[attribute]) {
            review[attribute] = req.body[attribute];
          } else {
            console.log("Trying to update non-whitelisted attribute " + attribute);
          }
        }

        review.save(function(err) {
          if (err) {
            handleError(res, err.message, "Failed to update review.");
          } else {
            res.status(201).json({ _id: review.id });
          }
        });
      }
    });
  });

app.use('/api', router);
