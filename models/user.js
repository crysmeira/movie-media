var mongoose                = require("mongoose"),
    passportLocalMongoose   = require("passport-local-mongoose");

mongoose.Promise = require("bluebird");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    age: String,
    email: String,
    country: String,
    about: String,
    wantToWatch: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Movie"
            }
        ],
    watched: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Movie"
            }
        ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);