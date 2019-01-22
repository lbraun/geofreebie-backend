var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var USERS_COLLECTION = "users";
var DATAPOINTS_COLLECTION = "datapoints";
var recording = true;

var app = express();
app.use(bodyParser.json({limit: "50mb"}));
app.use(cors());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
var mongodb_uri = process.env.MONGODB_URI || "mongodb://localhost:27017/test";
mongodb.MongoClient.connect(mongodb_uri, { useNewUrlParser: true }, function (err, client) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = client.db();
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// Method to add datapoints from user updates
function addUserUpdateDatapoint(userId, updatedAttributes) {
  db.collection(USERS_COLLECTION).findOne({ _id: new ObjectID(userId) }, function(err, user) {
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
function recordDatapoint(datapoint) {
  datapoint.timestamp = new Date();
  db.collection(DATAPOINTS_COLLECTION).insertOne(datapoint);
}

// *****************
// * API ENDPOINTS *
// *****************

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

// USERS API ROUTES BELOW

/*  "/api/users"
 *    GET: finds all users
 *    POST: finds or creates a new user based on auth0 user info
 */

app.get("/api/users", function(req, res) {
  console.log('>>> get("/api/users")');

  db.collection(USERS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get users.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/api/users", function(req, res) {
  console.log('>>> post("/api/users") req: ' + JSON.stringify(req.body));

  var user = req.body;

  if (!user.auth0Id) {
    handleError(res, "Invalid user input", "Must provide an auth0Id.", 400);
  } else {
    // Check if user exists
    db.collection(USERS_COLLECTION).findOne({auth0Id: user.auth0Id}, function(err, existingUser) {
      if (err) {
        handleError(res, err.message, "Failed to get user");
      } else {
        if (existingUser) {
          // User exists, so return it
          res.status(200).json(existingUser);
        } else {
          // User doesn't exsist in database yet, so create it
          user.createdAt = new Date();
          user.updatedAt = new Date();
          user.newlyCreated = true;

          db.collection(USERS_COLLECTION).insertOne(user, function(err, doc) {
            if (err) {
              handleError(res, err.message, "Failed to create new user.");
            } else {
              res.status(201).json(doc.ops[0]);
            }
          });
        }
      }
    });
  }
});

/*  "/api/users/:id"
 *    GET: find user by id
 *    PUT: update user by id
 */

app.get("/api/users/:id", function(req, res) {
  console.log('>>> get("/api/users/:id") id: ' + JSON.stringify(req.params.id));

  db.collection(USERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get user");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/api/users/:id", function(req, res) {
  console.log('>>> put("/api/users/:id") id: ' + JSON.stringify(req.params.id) + ' req: ' + JSON.stringify(req.body));

  var updateDoc = req.body;
  var userId = req.params.id;

  console.log(`Update request for user ${userId}:`);
  console.log(updateDoc);

  delete updateDoc._id;

  if (recording) {
    addUserUpdateDatapoint(userId, updateDoc);
  }

  updateDoc.updatedAt = new Date();


  db.collection(USERS_COLLECTION).updateOne({_id: new ObjectID(userId)}, {$set: updateDoc}, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update user");
    } else {
      updateDoc._id = userId;
      res.status(200).json(updateDoc);
    }
  });
});
