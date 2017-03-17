var mongoose = require("mongoose");

var movieSchema = new mongoose.Schema({
    imdbID: String,
    title: String,
    comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ]
});

module.exports = mongoose.model("Movie", movieSchema);