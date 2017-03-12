var express     = require("express"),
    app         = express(),
    bodyParse   = require("body-parser");
    
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParse.urlencoded({extended: true}));

app.get("/", function(req, res) {
    res.render("index");
});

app.post("/", function(req, res) {
    loadMore(res, req.body.search);
});

app.get("/movies", function(req, res) {
    loadMore(res);
});

// Show
app.get("/movies/:id", function(req, res) {
    getDetailedInfo(req.params.id, res);
});

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server started.");
});

function loadMore(res, search) {
    const request = require("request");

    request("http://www.omdbapi.com/?s=" + search, function(err, res2, body) {  
        if (err) {
            console.log("Error");
        }
        res.render("movies", {movies: JSON.parse(body)}); 
    });
}

function getDetailedInfo(id, res) {
    const request = require("request");

    request("http://www.omdbapi.com/?i=" + id + "&plot=full", function(err, res2, body) {  
        if (err) {
            console.log("Error");
        }
        res.render("details", {info : JSON.parse(body)});
    });
}