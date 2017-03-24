/*******************************************************************************
 * 
 * Profile's routes 
 * 
 ******************************************************************************/
 
var express = require("express");

var router = express.Router({mergeParams: true});
 
var User = require("../models/user"),
    Movie = require("../models/movie"),
    middleware = require("../middleware");

router.get("/:username", function(req, res) {
    User.findOne({"username": req.params.username}).populate("watched").
                            populate("wantToWatch").exec(function(err, user) {
        if (err) {
            console.log(err); // to do: change
        } else {
            res.render("profile/profile", {user: user});
        }
    });
});

// Edit user information
router.get("/:userID/edit", function(req, res) {
    res.render("profile/edit_info");
});
    
// Update user information
router.put("/:userID", function(req, res) {
    console.log("Editing user");
    User.findByIdAndUpdate(req.params.userID, req.body.user, function(err, user) {
       if (err) {
           console.log(err);
           res.redirect("back");
       } else {
           console.log("Editing user 1: " + user.username);
           res.redirect("/profile/" + user.username);
       }
    });
});

router.post("/:username/:movieID/watched", middleware.isLogged, function(req, res) {
    Movie.findOne({"imdbID": req.params.movieID}, function(err, movie) {
        if (err) {
            console.log(err); // to do: change
        } else {
            // check if this movie is in the database
            if (!movie) {
                middleware.createMovieInDatabase(req.params.movieID);
                console.log("saved");
            }
            middleware.addIfNotInAList(req.params.username, req.params.movieID, true, res);
        }
    });
});

router.delete("/:username/:movieID/watched", middleware.isLogged, function(req, res) {
    User.findOne({"username": req.params.username}, "watched",
                                                function(err, user_watched) {
        if (err) {
            console.log(err); // to do: change
        } else {
            middleware.findMovieAndRemove(req.params.movieID, user_watched, "watched", res);
            res.redirect("/profile/" + req.params.username);
        }
    });
});

router.post("/:username/:movieID/wantToWatch", middleware.isLogged, function(req, res) {
    Movie.findOne({"imdbID": req.params.movieID}, function(err, movie) {
        if (err) {
            console.log(err); // to do: change
        } else {
            if (!movie) {
                middleware.createMovieInDatabase(req.params.movieID);
                console.log("saved");
            }
            middleware.addIfNotInAList(req.params.username, req.params.movieID, false, res);
        }
    });
});

router.put("/:username/:movieID/wantToWatch", function(req, res) {
    User.findOne({"username": req.params.username}, "wantToWatch",
                                                    function(err, user_want) {
        if (err) {
            console.log(err); // to do: change
        } else {
            middleware.findMovieAndRemove(req.params.movieID, user_want, "wantToWatch", res);
            middleware.addMovieToUser(req.params.username, req.params.movieID, true, res);
        }
    });
});

router.delete("/:username/:movieID/wantToWatch", middleware.isLogged, function(req, res) {
    User.findOne({"username": req.params.username}, "wantToWatch", 
                                                    function(err, user_want) {
        if (err) {
            console.log(err); // to do: change
        } else {
            middleware.findMovieAndRemove(req.params.movieID, user_want, "wantToWatch", res);
            res.redirect("/profile/" + req.params.username);
        }
    });
});

module.exports = router;