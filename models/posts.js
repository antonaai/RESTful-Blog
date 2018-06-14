var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: String,
    createdAt: {type: Date, default: Date.now},
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Post", postSchema);