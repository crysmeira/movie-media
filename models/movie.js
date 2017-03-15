var mongoose = require("mongoose");

var movieSchema = mongoose.Schema({
    imdbID: String,
    comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ]
});

module.exports = mongoose.model("Movie", movieSchema);