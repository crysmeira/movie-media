var express     = require("express"),
    app         = express(),
    request     = require("request"),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    Movie       = require("./models/movie"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    seedDB      = require("./seeds");
    
    
seedDB();

mongoose.Promise = require("bluebird");
mongoose.connect("mongodb://localhost/movie_media");

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

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

// Run for every route
app.use(function(req, res, next) {
    res.locals.currUser = req.user;
    next();
});


app.get("/", function(req, res) {
    console.log(req.user);
    res.render("index");
});

app.post("/", function(req, res) {
    res.render("movies", {s: req.body.search});
});

// Show
app.get("/movies/:id", function(req, res) {
    getDetailedInfo(req.params.id, res);
});

/********************
 * Comments' routes 
 ********************/
 
app.get("/movies/:id/comments/new", isLogged, function(req, res) {
    res.render("new", {id: req.params.id});
});

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
            Movie.findOne({"imdbID": req.params.id}, "imdbID comments", function(err, m) {
                if (err) {
                    console.log("err"); // to do: change
                } else {
                    Comment.create(req.body.comment, function(err, comment) {
                        if (err) {
                            console.log(err);
                        } else {
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

/**************************
 * Authentication's routes 
 **************************/

/* Register */

app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    var user = new User(
                    {
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
                res.redirect("/");
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

/********************
 * Profile's routes 
 ********************/
 
app.get("/profile", function(req, res) {
    User.findById(req.user._id).populate("watched").populate("wantToWatch").exec(function(err, user) {
        if (err) {
            console.log(err); // to do: change
        } else {
            res.render("profile", {user: user});
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
            User.findOne({"username": req.params.username}, function(err, user) {
                if (err) {
                    console.log(err); // to do: change
                } else {
                    if (!user) {
                        console.log(err); // to do: change
                    } else {
                        Movie.findOne({"imdbID": req.params.id}, function(err, movie) {
                            if (err) {
                                console.log(err); // to do: change
                            } else {
                                user.watched.push(movie);
                                user.save();
                                console.log("movie watched added");
                                res.redirect("back");
                            }
                        });
                    }
                }
            });
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
            Movie.findOne({"imdbID": req.params.id}, function(err, movie) {
                if (err) {
                    console.log(err); // to do: change
                } else {
                    User.findOne({"username": req.params.username}, function(err, user) {
                        if (err) {
                            console.log(err); // to do: change
                        } else {
                            user.wantToWatch.push(movie);
                            user.save();
                            console.log("movie want to watch added");
                            res.redirect("back");
                        }
                    });
                }
            });
        }
    });
});

/****************
 * Start server 
 ****************/

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server started.");
});

/*************
 * Functions 
 *************/

function getDetailedInfo(id, res) {
    Movie.findOne({"imdbID": id}, "imdbID", function(err, movie) {
        if (err) {
            console.log(err); // to do: change
        } else {
            // check if this movie is in the database
            if (!movie) {
                createMovieInDatabase(id);
            }
            request("http://www.omdbapi.com/?i=" + id + "&plot=full", function(err, response, body) {  
                if (!err && response.statusCode == 200) {
                    // find the movie in the database and populate it with its comments
                    Movie.findOne({"imdbID": id}).populate("comments").exec(function(err, movieWithComments) {
                        if (err) {
                            console.log(err); // to do: change
                        }
                        console.log(movieWithComments);
                        res.render("details", {info : JSON.parse(body), movie: movieWithComments});
                    });
                } else {
                    console.log(err); // to do: change
                }
            });
        }
    });
}

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

function isLogged(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}