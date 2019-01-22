var mongoose = require("mongoose");
var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var User = require("./user");
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
function addUserUpdateDatapoint(userId, updatedAttributes) {
  User.findById(userId, function(err, user) {
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
              userId: userId,
              coords: updatedAttributes.coords || user.coords,
              action: `Updated ${key} from ${oldValue} to ${newValue}`,
            });
          }
        }
      } else {
        recordDatapoint({
          userId: userId,
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
    User.find(function(err, users) {
        if (err) {
          handleError(res, err.message, "Failed to get users.");
        } else {
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
        }

        var whitelistedAttributes = {
          "approved":           false,
          "auth0Id":            false,
          "contactInformation": true,
          "coords":             true,
          "family_name":        true,
          "gender":             true,
          "given_name":         true,
          "hasConsented":       true,
          "locale":             true,
          "loginsCount":        true,
          "name":               true,
          "newlyCreated":       true,
          "nickname":           true,
          "offer":              true,
          "offersCompleted":    true,
          "picture":            true,
          "shareLocation":      true,
          "useLocation":        true,
        };

        for (var attribute in req.body) {
          if (whitelistedAttributes[attribute]) {
            user[attribute] = req.body[attribute];
          } else {
            console.log("Trying to update non-whitelisted attribute " + attribute);
          }
        }

        if (recording) {
          addUserUpdateDatapoint(user.id, req.body);
        }

        user.save(function(err) {
          if (err) {
            handleError(res, err.message, "Failed to update user.");
          } else {
            res.status(201).json({ _id: user.id });
          }
        });
      }
    });
  });

app.use('/api', router);
