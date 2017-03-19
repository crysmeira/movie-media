var express         = require("express"),
    app             = express(),
    request         = require("request"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    methodOverride  = require("method-override"),
    Movie           = require("./models/movie"),
    Comment         = require("./models/comment"),
    User            = require("./models/user"),
    seedDB          = require("./seeds");
    
    
//seedDB();

mongoose.Promise = require("bluebird");
mongoose.connect("mongodb://localhost/movie_media");

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));

// Configuration (passport)
app.use(require("express-session")({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Run it for every route
app.use(function(req, res, next) {
    res.locals.currUser = req.user;
    next();
});

app.get("/", function(req, res) {
    res.redirect("/movies");
    
});

/*******************************************************************************
 * 
 * Movies' routes 
 * 
 ******************************************************************************/
 
app.get("/movies", function(req, res) {
    res.render("index");
});
 
app.post("/movies", function(req, res) {
    res.render("movies/movies", {s: req.body.search});
});

// Show a specific movie
app.get("/movies/:id", function(req, res) {
    getDetailedInfo(req.params.id, res);
});

/*******************************************************************************
 * 
 * Comments' routes 
 * 
 ******************************************************************************/

// New comment
app.get("/movies/:id/comments/new", isLogged, function(req, res) {
    res.render("cooments/new", {id: req.params.id});
});

// Create comment
app.post("/movies/:id/comments", isLogged, function(req, res) {
    Movie.findOne({"imdbID": req.params.id}, "imdbID", function(err, movie) {
        if (err) {
            console.log(err); // to do: improve
        } else {
            // check if this movie is in the database
            console.log("movie1: " + movie);
            if (!movie) {
                createMovieInDatabase(req.params.id);
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
app.put("/movies/:id/comments/:comment_id", checkCommentOwnership, 
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
app.delete("/movies/:id/comments/:comment_id", checkCommentOwnership,
                                                        function(req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function(err) {
        if (err) {
            console.log(err); // to do: change
        } else {
            res.redirect("/movies/" + req.params.id);
        }
    });
});

/*******************************************************************************
 * 
 * Authentication's routes 
 * 
 ******************************************************************************/

/* Register */

app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    var user = new User(
                    {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        username: req.body.username,
                        age: req.body.age,
                        email: req.body.email,
                        country: req.body.country,
                        about: req.body.about,
                        watched: [],
                        wantToWatch: []
                    });
    User.register(user, req.body.password, function(err, u) {
        if (err) {
            console.log(err); // to do: change
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/movies");
            });
        }
    });
});

/* Login */

app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", 
         passport.authenticate("local", 
            {
                successRedirect: "/",
                failureRedirect: "login"
                
            }),
         function(req, res) {
});

/* Logout */

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

/*******************************************************************************
 * 
 * Profile's routes 
 * 
 ******************************************************************************/
 
app.get("/profile/:username", function(req, res) {
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
app.get("/profile/:id/edit", function(req, res) {
    res.render("profile/edit_info");
});
    
// Update user information
app.put("/profile/:id", function(req, res) {
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, user) {
       if (err) {
           console.log(err);
           res.redirect("back");
       } else {
           res.redirect("/profile");
       }
    });
});

app.post("/:username/:id/watched", isLogged, function(req, res) {
    Movie.findOne({"imdbID": req.params.id}, function(err, movie) {
        if (err) {
            console.log(err); // to do: change
        } else {
            // check if this movie is in the database
            if (!movie) {
                createMovieInDatabase(req.params.id);
                console.log("saved");
            }
            addIfNotInAList(req.params.username, req.params.id, true, res);
        }
    });
});

app.delete("/:username/:id/watched", isLogged, function(req, res) {
    User.findOne({"username": req.params.username}, "watched",
                                                function(err, user_watched) {
        if (err) {
            console.log(err); // to do: change
        } else {
            findMovieAndRemove(req.params.id, user_watched, "watched", res);
            res.redirect("/profile/" + req.params.username);
        }
    });
});

app.post("/:username/:id/wantToWatch", isLogged, function(req, res) {
    Movie.findOne({"imdbID": req.params.id}, function(err, movie) {
        if (err) {
            console.log(err); // to do: change
        } else {
            if (!movie) {
                console.log(err); // to do: change
            }
            addIfNotInAList(req.params.username, req.params.id, false, res);
        }
    });
});

app.put("/:username/:id/wantToWatch", function(req, res) {
    User.findOne({"username": req.params.username}, "wantToWatch",
                                                    function(err, user_want) {
        if (err) {
            console.log(err); // to do: change
        } else {
            findMovieAndRemove(req.params.id, user_want, "wantToWatch", res);
            addMovieToUser(req.params.username, req.params.id, true, res);
        }
    });
});

app.delete("/:username/:id/wantToWatch", isLogged, function(req, res) {
    User.findOne({"username": req.params.username}, "wantToWatch", 
                                                    function(err, user_want) {
        if (err) {
            console.log(err); // to do: change
        } else {
            findMovieAndRemove(req.params.id, user_want, "wantToWatch", res);
            res.redirect("/profile/" + req.params.username);
        }
    });
});

/*******************************************************************************
 * 
 * Start server
 * 
 ******************************************************************************/

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server started.");
});

/*******************************************************************************
 * 
 * Functions 
 * 
 ******************************************************************************/

/*******************************************************************************
 * 
 * Checks if the user is logged in. If so, goes to the next page. Otherwise, 
 * redirect to login page.
 * 
 ******************************************************************************/
function isLogged(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

/*******************************************************************************
 * 
 * Checks if the user is the owner of the content.
 * 
 ******************************************************************************/
function checkCommentOwnership(req, res, next) {
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
}

/*******************************************************************************
 * 
 * Get detailed information about a movie through the OMDB API and render a page
 * that display them to the user.
 * 
 ******************************************************************************/
function getDetailedInfo(id, res) {
    Movie.findOne({"imdbID": id}, "imdbID", function(err, movie) {
        if (err) {
            console.log(err); // to do: change
        } else {
            // check if this movie is in the database
            if (!movie) {
                createMovieInDatabase(id);
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
}

/*******************************************************************************
 * 
 * Create a register for the movie in the database containing its imdb id, its 
 * tile and an empty array for the comments.
 * 
 ******************************************************************************/
function createMovieInDatabase(id) {
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
}

/*******************************************************************************
 * 
 * Checks if the movie is already present in one of the lists (watched or want
 * to want). If it is not present in any of the lists, add to the desired one.
 * 
 ******************************************************************************/
function addIfNotInAList(username, movieID, field, res) {
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
                    addMovieToUser(username, movieID, field, res);
                }
            });
        }
    });
}

/*******************************************************************************
 * 
 * Add the movie to the desired list (watched or want to watch) related to the
 * user.
 * 
 ******************************************************************************/
function addMovieToUser(username, movieID, watched, res) {
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
}

/*******************************************************************************
 * 
 * Find a movie in the database based on its imdb id and remove it from the list
 * identified as 'field'
 * 
 ******************************************************************************/
function findMovieAndRemove(movieID, user, field, res) {
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
}