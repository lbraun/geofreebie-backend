const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  _userId: mongoose.Schema.Types.ObjectId,
  userType: String,
  _otherUserId: mongoose.Schema.Types.ObjectId,
  offerTitle: String,
  question1: { type: String, default: "" },
  question2: { type: String, default: "" },
  question3: { type: String, default: "" },
  question4: { type: String, default: "" },
  status: { type: String, default: "new" },
  dateSubmitted: Date,
},
{
  timestamps: true
});

module.exports = mongoose.model("Review", reviewSchema);
