/*******************************************************************************
 * 
 * Comments' routes 
 * 
 ******************************************************************************/

var express = require("express");

var router = express.Router({mergeParams: true});

var Movie       = require("../models/movie"),
    Comment     = require("../models/comment"),
    middleware  = require("../middleware");

// New comment
router.get("/new", middleware.isLogged, function(req, res) {
    res.render("cooments/new", {id: req.params.id});
});

// Create comment
router.post("/", middleware.isLogged, function(req, res) {
    Movie.findOne({"imdbID": req.params.id}, "imdbID", function(err, movie) {
        if (err) {
            console.log(err); // to do: improve
        } else {
            // check if this movie is in the database
            console.log("movie1: " + movie);
            if (!movie) {
                middleware.createMovieInDatabase(req.params.id);
                console.log("saved");
            }
            Movie.findOne({"imdbID": req.params.id}, "imdbID comments",
                                                            function(err, m) {
                if (err) {
                    console.log("err"); // to do: change
                } else {
                    Comment.create(req.body.comment, function(err, comment) {
                        if (err) {
                            console.log(err);
                        } else {
                            // add comment to database
                            comment.author.id = req.user._id;
                            comment.author.username = req.user.username;
                            comment.save();
                            // add comment to this movie
                            m.comments.push(comment);
                            m.save();
                            console.log("comment added to movie");
                            res.redirect("/movies/" + req.params.id);
                        }
                    });
                }
            });
        }
    });
});

// Update comment
router.put("/:comment_id", middleware.checkCommentOwnership, 
                                                        function(req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment,
                                                    function(err, comment) {
        if (err) {
            console.log(err); // to do: change
            res.redirect("back");
        } else {
            res.redirect("/movies/" + req.params.id);
        }
    });
});

// Delete comment
router.delete("/:comment_id", middleware.checkCommentOwnership,
                                                        function(req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function(err) {
        if (err) {
            console.log(err); // to do: change
        } else {
            res.redirect("/movies/" + req.params.id);
        }
    });
});

module.exports = router;