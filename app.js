var express     = require("express"),
    app         = express(),
    request     = require("request"),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    Movie       = require("./models/movie"),
    Comment     = require("./models/comment"),
    seedDB      = require("./seeds");
    
seedDB();

mongoose.connect("mongodb://localhost/movie_media");

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

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

/* Comments */
app.get("/movies/:id/comments/new", function(req, res) {
    res.render("new", {id: req.params.id});
});

app.post("/movies/:id/comments", function(req, res) {
    var query = Movie.findOne({"imdbID": req.params.id});
    if (!query) {
        var data = {imdbID: req.params.id, comments: []};
        Movie.create(data, function(err, movie) {
            if (err) {
                console.log("err"); // to do: change
            } else {
                movie.save();
                console.log("movie saved to database");
            }
        });
    }
    Movie.findOne({"imdbID": req.params.id}, function(err, movie) {
        if (err) {
            console.log("err"); // to do: improve
        } else {
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    console.log("err");
                } else {
                    // add comment to movie
                    movie.comments.push(comment);
                    movie.save();
                    console.log("comment added to movie");
                    res.redirect("/movies/" + req.params.id);
                }
            });
        }
    });
});

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server started.");
});

function getDetailedInfo(id, res) {
    Movie.findOne({"imdbID": id}, "imdbID", function(err, movie) {
        if (err) {
            console.log(err); // to do: change
        } else {
            console.log("Movie: " + movie);
            if (!movie) {
                var data = {imdbID: id, comments: []};
                Movie.create(data, function(err, movie) {
                    if (err) {
                        console.log("err"); // to do: change
                    } else {
                        movie.save();
                        console.log("movie saved to database");
                    }
                });
            }
            request("http://www.omdbapi.com/?i=" + id + "&plot=full", function(err, response, body) {  
                if (!err && response.statusCode == 200) {
                    Movie.findOne({"imdbID": id}).populate("comments").exec(function(err, movie) {
                        if (err) {
                            console.log("err"); // to do: change
                        }
                        console.log(movie);
                        res.render("details", {info : JSON.parse(body), movie: movie});
                    });
                }
                console.log("Error"); // to do: change
            });
        }
    });
}