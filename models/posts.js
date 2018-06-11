var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: String
    //author: String
});

module.exports = mongoose.model("Post", postSchema);