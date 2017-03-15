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

app.get("/", function(req, res) {
    res.render("index");
});

app.post("/", function(req, res) {
    res.render("movies", {s: req.body.search, page: req.body.page});
});

// Show
app.get("/movies/:id", function(req, res) {
    getDetailedInfo(req.params.id, res);
});


/********************
 * Comments' routes 
 ********************/
 
app.get("/movies/:id/comments/new", function(req, res) {
    res.render("new", {id: req.params.id});
});

app.post("/movies/:id/comments", function(req, res) {
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
                            console.log("movie: " + m);
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
    var user = new User({username: req.body.username});
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
    var data = {imdbID: id, comments: []};
    Movie.create(data, function(err, movie) {
        if (err) {
            console.log(err); // to do: change
        } else {
            movie.save();
            console.log("movie saved to database");
        }
    });
}