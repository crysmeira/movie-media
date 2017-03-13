var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser");
    
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

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server started.");
});

function getDetailedInfo(id, res) {
    const request = require("request");

    request("http://www.omdbapi.com/?i=" + id + "&plot=full", function(err, res2, body) {  
        if (err) {
            console.log("Error");
        }
        res.render("details", {info : JSON.parse(body)});
    });
}