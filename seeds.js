var mongoose = require("mongoose");
var Movie = require("./models/movie");
var Comment = require("./models/comment");

var data = [
    {
        imdbID: "tt2294629"
    },
    {
        imdbID: "tt4007502"
    },
    {
        imdbID: "tt2294629"
    },
    {
        imdbID: "tt0388318"
    }
];

function seedDB() {
    // remove all movies
    Movie.remove({}, function(err) {
        if (err) {
            console.log("problem removing");
        }
        console.log("removed movies!");
        // add movies
        data.forEach(function(d) {
            Movie.create(d, function(err, movie) {
                if (err) {
                    console.log("err");
                } else {
                    console.log("adding movie");
                    Comment.create({
                        text: "First Comment",
                        author: "Author 1",
                    }, function(err, comment) {
                        if (err) {
                            console.log("err");
                        } else {
                            movie.comments.push(comment);
                            movie.save();
                            console.log("comment added to movie");
                        }
                    });
                }
            });
        });
    });
}

module.exports = seedDB;