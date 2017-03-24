/*******************************************************************************
 * 
 * Movies' routes 
 * 
 ******************************************************************************/
var express = require("express");

var router = express.Router({mergeParams: true});

var middleware = require("../middleware");

router.get("/", function(req, res) {
    res.render("index");
});
 
router.post("/", function(req, res) {
    res.render("movies/movies", {s: req.body.search});
});

// Show a specific movie
router.get("/:id", function(req, res) {
    middleware.getDetailedInfo(req.params.id, res);
});

module.exports = router;