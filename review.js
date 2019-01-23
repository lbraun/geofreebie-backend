const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  _giverId: mongoose.Schema.Types.ObjectId,
  _recipientId: mongoose.Schema.Types.ObjectId,
  giverResponses: {
    question1: { type: String, default: "" },
    question2: { type: String, default: "" },
    question3: { type: String, default: "" },
    question4: { type: String, default: "" },
  },
  recipientResponses: {
    question1: { type: String, default: "" },
    question2: { type: String, default: "" },
    question3: { type: String, default: "" },
    question4: { type: String, default: "" },
  },
  status: { type: String, default: "new" },
  dateSubmitted: Date,
},
{
  timestamps: true
});

module.exports = mongoose.model("Review", reviewSchema);
