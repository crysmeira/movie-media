var Comment = require("../models/comment"),
    Movie   = require("../models/movie"),
    User    = require("../models/user"),
    request = require("request");

var middlewareObj = {};

/*******************************************************************************
 * 
 * Checks if the user is logged in. If so, goes to the next page. Otherwise, 
 * redirect to login page.
 * 
 ******************************************************************************/
middlewareObj.isLogged = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
};

/*******************************************************************************
 * 
 * Checks if the user is the owner of the content.
 * 
 ******************************************************************************/
middlewareObj.checkCommentOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function(err, comment) {
            if (err) {
                console.log(err); // to do: change
            } else {
                if (comment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    res.redirect("back");
                }
            }
        });
    } else {
        res.redirect("back");
    }
};

/*******************************************************************************
 * 
 * Get detailed information about a movie through the OMDB API and render a page
 * that display them to the user.
 * 
 ******************************************************************************/
middlewareObj.getDetailedInfo = function(id, res) {
    Movie.findOne({"imdbID": id}, "imdbID", function(err, movie) {
        if (err) {
            console.log(err); // to do: change
        } else {
            // check if this movie is in the database
            if (!movie) {
                this.createMovieInDatabase(id);
            }
            request("http://www.omdbapi.com/?i=" + id + "&plot=full", 
                                                function(err, response, body) {  
                if (!err && response.statusCode == 200) {
                    // find the movie in the DB and populate with its comments
                    Movie.findOne({"imdbID": id}).populate("comments").
                                        exec(function(err, movieWithComments) {
                        if (err) {
                            console.log(err); // to do: change
                        }
                        console.log(movieWithComments);
                        res.render("movies/details", {info : JSON.parse(body), 
                                               movie: movieWithComments});
                    });
                } else {
                    console.log(err); // to do: change
                }
            });
        }
    });
};

/*******************************************************************************
 * 
 * Create a register for the movie in the database containing its imdb id, its 
 * tile and an empty array for the comments.
 * 
 ******************************************************************************/
middlewareObj.createMovieInDatabase = function(id) {
    // get movie title
    request("http://www.omdbapi.com/?i=" + id, function(err, response, body) {  
        if (!err && response.statusCode == 200) {
            var info = JSON.parse(body);
            var data = {imdbID: id, title: info["Title"], comments: []};
            Movie.create(data, function(err, movie) {
                if (err) {
                    console.log(err); // to do: change
                } else {
                    movie.save();
                    console.log("movie saved to database");
                }
            });
        } else {
            console.log(err); // to do: change
        }
    });
};

/*******************************************************************************
 * 
 * Checks if the movie is already present in one of the lists (watched or want
 * to want). If it is not present in any of the lists, add to the desired one.
 * 
 ******************************************************************************/
middlewareObj.addIfNotInAList = function(username, movieID, field, res) {
    User.findOne({"username": username}, "watched wantToWatch",
                                                        function(err, user) {
        if (err) {
            console.log(err); // to do: change
        } else {
            Movie.findOne({"imdbID": movieID}, function(err, movie) {
                if (err) {
                    console.log(err);
                } else {
                    for (var i = 0; i < user["watched"].length; i++) {
                        if (JSON.stringify(user["watched"][i]) 
                                            === JSON.stringify(movie["_id"])) {
                            console.log("repeated: /movies/" + movieID);
                            res.redirect("/movies/" + movieID);
                            return;
                        }
                    }
                    for (var i = 0; i < user["wantToWatch"].length; i++) {
                        if (JSON.stringify(user["wantToWatch"][i])
                                            === JSON.stringify(movie["_id"])) {
                            console.log("repeated: /movies/" + movieID);
                            res.redirect("/movies/" + movieID);
                            return;
                        }
                    }
                    console.log("new movie");
                    this.addMovieToUser(username, movieID, field, res);
                }
            });
        }
    });
};

/*******************************************************************************
 * 
 * Add the movie to the desired list (watched or want to watch) related to the
 * user.
 * 
 ******************************************************************************/
middlewareObj.addMovieToUser = function(username, movieID, watched, res) {
    User.findOne({"username": username}, function(err, user) {
        if (err) {
            console.log(err); // to do: change
        } else {
            if (!user) {
                res.redirect("/login");
            } else {
                Movie.findOne({"imdbID": movieID}, function(err, movie) {
                    if (err) {
                        console.log(err); // to do: change
                    } else {
                        if (watched) {
                            user.watched.push(movie);
                        } else {
                            user.wantToWatch.push(movie);
                        }
                        user.save();
                        console.log("movie watched added");
                        res.redirect("/profile/" + username);
                    }
                });
            }
        }
    });
};

/*******************************************************************************
 * 
 * Find a movie in the database based on its imdb id and remove it from the list
 * identified as 'field'
 * 
 ******************************************************************************/
middlewareObj.findMovieAndRemove = function(movieID, user, field, res) {
    Movie.findOne({"imdbID": movieID}, "_id", function(err, movie) {
        if (err) {
            console.log(err);
        } else {
            if (!movie) {
                return;    
            }
            for (var i = 0; i < user[field].length; i++) {
                if (JSON.stringify(user[field][i])
                                            === JSON.stringify(movie["_id"])) {
                    user[field].splice(i, 1);
                    user.save();
                    console.log("removed from user's list " + field);
                    return;
                }
            }
        }
    });
};

module.exports = middlewareObj;