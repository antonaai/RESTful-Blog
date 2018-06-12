var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var passport = require("passport");
var localStrategy = require("passport-local");
var User = require("./models/user.js");
var Post = require("./models/posts.js");
var Comment = require("./models/comments.js");

// connecting the app to the database
mongoose.connect("mongodb://localhost/new-blog");

//APP CONFIGURATION
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOverride("_method"));

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Breakday",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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

//DELETE ROUTE
app.delete("/posts/:id/comment/:commentid", function(req, res) {
    Post.findById(req.params.id, function(err, foundPost) {
        if(err)
            console.log(err);
        else {
            Comment.findByIdAndRemove(req.params.commentid, function(err, comment){
                if(err)
                    console.log(err);
                else 
                    return res.redirect("/posts/" + req.params.id);
            });
        }
    });
});

//USER ROUTES ------------------------------------------------------------------------
//REGISTER FORM ROUTE
app.get("/register", function(req, res) {
    res.render("register.ejs");
});

//SIGN UP ROUTE
app.post("/register", function(req, res) {
    var newUser = new User({
        username: req.body.username,
        name: req.body.name,
        surname: req.body.surname
    });
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/posts");
        });
    });
});

//LISTENER
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("BLOG ONLINE");
})