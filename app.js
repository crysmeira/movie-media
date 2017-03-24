var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    methodOverride  = require("method-override"),
    User            = require("./models/user"),
    seedDB          = require("./seeds");
    
var movieRoutes             = require("./routes/movie"),    
    commentRoutes           = require("./routes/comment"),
    userRoutes              = require("./routes/user"),
    indexRoutes             = require("./routes/index");
    
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

// Requiring routes
app.use("/movies", movieRoutes);
app.use("/movies/:id/comments", commentRoutes);
app.use("/profile", userRoutes);
app.use("/", indexRoutes);

/*******************************************************************************
 * 
 * Start server
 * 
 ******************************************************************************/
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server started.");
});