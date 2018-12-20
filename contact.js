const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ContactSchema = new Schema(
  {
    name: String,
    email: String,
    createDate: Date,
  },
);

module.exports = mongoose.model("Contact", ContactSchema);
