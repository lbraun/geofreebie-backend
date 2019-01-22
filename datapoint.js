const mongoose = require("mongoose");

const datapointSchema = new mongoose.Schema({
  _userId: mongoose.Schema.Types.ObjectId,
  coords: [Number],
  action: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Datapoint", datapointSchema);
