var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var Post = require("./models/posts.js");
var Comment = require("./models/comments.js");

// connecting the app to the database
mongoose.connect("mongodb://localhost/new-blog");

//APP CONFIGURATION
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOverride("_method"));

// Post.create({
//     title: "A new style",
//     description: "Sunt in culpa qui officia deserunt mollit anim id est laborum consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
//     image: "https://images.pexels.com/photos/432059/pexels-photo-432059.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
// }, function(err, post){
//     if(err)
//         console.log(err);
//     else 
//         console.log(post);
// });

// RESTFUL ROUTES -- CRUD

//POSTS ROUTES

//INTIAL ROUTES
app.get("/", function(req, res) {
    res.redirect("/posts");
});

app.get("/posts", function(req, res){
    // FIND THE POSTS
    Post.find({}, function(err, posts){
        if(err){
            console.log(err);
        } else {
            // IF THE APP FOUND THEM RENDER THE HOMEPAGE
            res.render("home.ejs", {posts: posts});
        }
    });
});

//CREATE ROUTES
app.get("/posts/new", function(req, res){
    res.render("new.ejs");
});

app.post("/posts/new", function(req, res){
    Post.create({
        title: req.body.title,
        image: req.body.image,
        description: req.body.description
    }, function(err, newPost){
        if(err){
            res.redirect("/posts/new");
        } else {
            res.redirect("/posts");
        }
    });
});

//READ ROUTE
app.get("/posts/:id", function(req, res){
   Post.findById(req.params.id).populate("comments").exec(function(err, foundPost){
       if(err){
           console.log(err);
           res.send("404 - PAGE NOT FOUND");
       } else {
          res.render("show.ejs", {post: foundPost});
       }
   });
});

//UPDATE ROUTES
app.get("/posts/:id/edit", function(req, res){
   Post.findById(req.params.id, function(err, foundPost){
       if(err){
           console.log(err);
           res.send("404 - PAGE NOT FOUND");
       } else {
          res.render("edit.ejs", {post: foundPost});
       }
   });
});

app.put("/posts/:id", function(req, res){
    Post.findByIdAndUpdate(req.params.id, req.body.post, function(err, updatedPost){
        if(err){
            console.log(err);
            res.redirect("/posts");
        } else {
            res.redirect("/posts/" + req.params.id);
        }
    });
});

//DESTROY ROUTE
app.delete("/posts/:id", function(req, res){
    Post.findByIdAndRemove(req.params.id, function(err){
        if(err)
            console.log(err);
        else
            res.redirect("/posts");
    });
});


//COMMENT ROUTES --------------------------------------------------

//NEW ROUTE
app.post("/posts/:id/comment", function(req, res){
    Post.findById(req.params.id, function(err, foundPost){
        if(err) {
            console.log(err);
            res.redirect("/posts");
        } else {
            Comment.create({text: req.body.text}, function(err, newComment){
                if(err)
                    console.log(err);
                else {
                    newComment.save();
                    foundPost.comments.push(newComment);
                    foundPost.save();
                    return res.redirect("/posts/" + req.params.id);
                }
            });
        }
    });
});

//LISTENER
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("BLOG ONLINE");
})