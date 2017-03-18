var mongoose = require("mongoose");
var Movie = require("./models/movie");
var Comment = require("./models/comment");
var User = require("./models/user");

function seedDB() {
    // remove all movies
    User.remove({}, function(err) {
        if (err) {
            console.log("problem removing");
        }
        console.log("removed users!");
    });
    // remove all comments
    Comment.remove({}, function(err) {
        if (err) {
            console.log("problem removing");
        }
        console.log("removed comments!");
    });
    // remove all movies
    Movie.remove({}, function(err) {
        if (err) {
            console.log("problem removing");
        }
        console.log("removed movies!");
    });
}

module.exports = seedDB;