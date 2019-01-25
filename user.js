const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  approved: Boolean,
  auth0Id: String,
  contactInformation: {
    email:       { type: String, default: "" },
    facebook:    { type: String, default: "" },
    phone:       { type: String, default: "" },
    whatsapp:    { type: String, default: "" },
    useEmail:    { type: Boolean, default: false },
    useFacebook: { type: Boolean, default: false },
    usePhone:    { type: Boolean, default: false },
    useWhatsapp: { type: Boolean, default: false },
  },
  coords: [Number],
  demographicSurvey: [{
    questionId: String,
    response: String,
  }],
  family_name: String,
  gender: String,
  given_name: String,
  hasCompletedDemographicSurvey: Boolean,
  hasCompletedConsentForm: Boolean,
  locale: String,
  loginsCount: Number,
  name: String,
  newlyCreated: Boolean,
  nickname: String,
  offer: {
      title: String,
      picture: String,
      description: String,
      available: Boolean,
  },
  offersCompleted: Number,
  picture: String,
  shareLocation: Boolean,
  useLocation: Boolean,
},
{
  timestamps: true
});

userSchema.methods.speak = function () {
  var greeting = this.name
    ? "My name is " + this.name
    : "I don't have a name";
    console.log(greeting);
}

module.exports = mongoose.model("User", userSchema);
