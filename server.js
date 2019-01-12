var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var USERS_COLLECTION = "users";

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
  db.collection(USERS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get users.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/api/users", function(req, res) {
  var user = req.body;
  user.auth0Id = user.sub;
  delete user.sub;

  if (!req.body.name) {
    handleError(res, "Invalid user input", "Must provide a name.", 400);
  } else {
    // Check if user exists
    db.collection(USERS_COLLECTION).findOne({auth0Id: user.auth0Id}, function(err, doc) {
      if (err) {
        handleError(res, err.message, "Failed to get user");
      } else {
        if (doc) {
          // User exists, so return it
          res.status(200).json(doc);
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
 *    DELETE: deletes user by id
 */

app.get("/api/users/:id", function(req, res) {
  db.collection(USERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get user");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/api/users/:id", function(req, res) {
  console.log("Update request body:");
  console.log(req.body);

  var updateDoc = req.body;

  delete updateDoc._id;
  updateDoc.updatedAt = new Date();

  db.collection(USERS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, {$set: updateDoc}, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update user");
    } else {
      updateDoc._id = req.params.id;
      res.status(200).json(updateDoc);
    }
  });
});

app.delete("/api/users/:id", function(req, res) {
  db.collection(USERS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete user");
    } else {
      res.status(200).json(req.params.id);
    }
  });
});

/*  "/api/auth0_users/:auth0_id"
 *    GET: find user by auth0Id
 */

app.get("/api/auth0_users/:auth0_id", function(req, res) {
  db.collection(USERS_COLLECTION).findOne({ auth0Id: req.params.auth0_id }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get user");
    } else {
      res.status(200).json(doc);
    }
  });
});
