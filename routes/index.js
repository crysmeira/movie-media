var express = require("express");

var router = express.Router({mergeParams: true});

router.get("/", function(req, res) {
    res.redirect("/movies");
    
});

router.get("*", function(req, res) {
    res.render("not_found");
});

module.exports = router;