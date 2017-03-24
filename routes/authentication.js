/*******************************************************************************
 * 
 * Authentication's routes 
 * 
 ******************************************************************************/

var express = require("express"),
    passport = require("passport");

var router = express.Router({mergeParams: true});

var User = require("../models/user");

/* Register */

router.get("/register", function(req, res) {
    res.render("register");
});

router.post("/register", function(req, res) {
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

router.get("/login", function(req, res) {
    res.render("login");
});

router.post("/login", 
         passport.authenticate("local", 
            {
                successRedirect: "/",
                failureRedirect: "login"
                
            }),
         function(req, res) {
});

/* Logout */

router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

module.exports = router;