const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// this will be our database's data structure
const UserSchema = new Schema(
  {
    id: Number,
    name: String,
    password: String,
    role: String,
    contactInformation: String,
    offerDescription: String,
    joinDate: Date,
    lastLoginDate: Date,
    longitude: Number,
    latitude: Number,
    useLocation: false,
    shareLocation: false
  },
  { timestamps: true }
);

// export the new Schema so we could modify it using Node.js
module.exports = mongoose.model("User", UserSchema);
