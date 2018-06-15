var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var passport = require("passport");
var localStrategy = require("passport-local");
var flash = require("connect-flash");
var User = require("./models/user.js");
var Post = require("./models/posts.js");
var Comment = require("./models/comments.js");

// connecting the app to the database
// mongoose.connect("mongodb://localhost/new-blog");
mongoose.connect("mongodb://anton66:password66@ds161790.mlab.com:61790/new-blog");

//APP CONFIGURATION
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");
app.locals.moment.locale("it");

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

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
// RESTFUL ROUTES -- CRUD

//POSTS ROUTES -----------------------------------------------------------------
//INTIAL ROUTES
app.get("/", function(req, res) {
    res.redirect("/posts");
});

app.get("/posts", function(req, res){
    // FIND THE POSTSc
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
app.get("/posts/new", isLoggedIn, function(req, res){
    res.render("new.ejs");
});

app.post("/posts/new", isLoggedIn, function(req, res){
    Post.create({
        title: req.body.title,
        image: req.body.image,
        description: req.body.description,
        author: {
            id: req.user._id,
            username: req.user.username
        }
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
app.get("/posts/:id/edit", checkPostOwnership, function(req, res){
   Post.findById(req.params.id, function(err, foundPost){
       if(err){
           console.log(err);
           res.send("404 - PAGE NOT FOUND");
       } else {
          res.render("edit.ejs", {post: foundPost});
       }
   });
});

app.put("/posts/:id", checkPostOwnership, function(req, res){
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
app.delete("/posts/:id", checkPostOwnership, function(req, res){
    Post.findByIdAndRemove(req.params.id, function(err){
        if(err)
            console.log(err);
        else {
            req.flash("success", "Goodbye post");
            res.redirect("/posts");
        }
    });
});


//COMMENT ROUTES ---------------------------------------------------------------

//NEW ROUTE
app.post("/posts/:id/comment", isLoggedIn, function(req, res){
    Post.findById(req.params.id, function(err, foundPost){
        if(err) {
            console.log(err);
            res.redirect("/posts");
        } else {
            Comment.create({text: req.body.text}, function(err, newComment){
                if(err)
                    console.log(err);
                else {
                    //add username and id to comment
                    newComment.author.id = req.user._id;
                    newComment.author.username = req.user.username;
                    //save comment
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
app.delete("/posts/:id/comment/:commentid", checkCommentOwnership, function(req, res) {
    Post.findById(req.params.id, function(err, foundPost) {
        if(err)
            console.log(err);
        else {
            Comment.findByIdAndRemove(req.params.commentid, function(err, comment){
                if(err)
                    console.log(err);
                else {
                    req.flash("success", "Commento cancellato");
                    return res.redirect("/posts/" + req.params.id);
                }
            });
        }
    });
});

//USER ROUTES ------------------------------------------------------------------
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
            req.flash("success", "Benvenuto/a !!!");
            res.redirect("/posts");
        });
    });
});

//LOGIN ROUTE
app.get("/login", function(req, res) {
    res.render("login.ejs");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/posts",
    failureRedirect: "/login"
}), function(req, res){});

//LOGOUT ROUTE
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/posts");
});

//MIDDLEWARES ------------------------------------------------------------------
function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();
    else {
        req.flash("error", "Devi essere iscritto per poterlo fare");
        res.redirect("/login");
    }
}

function checkCommentOwnership(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.commentid, function(err, foundComment){
            if(err){
                req.flash("error", "Commento non trovato riprova più tardi");  
                res.redirect("/posts");
            } else {
                if(!foundComment){
                    req.flash("error", "Commento non trovato riprova più tardi");
                    return res.redirect("/posts");
                }
                //does the user own the comment
                if(foundComment.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "Non sei il proprietario di questo commento");
                    res.redirect("/posts");
                }
            }
        });
    } else {
        req.flash("error", "Devi essere iscritto per poterlo fare");
        res.redirect("/login");
    }
}

function checkPostOwnership(req, res, next){
    //FIRST CHECK IF THE USER IS LOGGED IN
    if(req.isAuthenticated()){
        Post.findById(req.params.id, function(err, foundPost){
           if(err){
               req.flash("error", "Post non trovato!");
               res.redirect("/posts");
           } else {
               if(!foundPost){
                   req.flash("error", "Post non trovato");
                   return res.redirect("/posts");
               }
               //SECOND CHECK IF THE USER OWNS THE POST
               if(foundPost.author.id.equals(req.user._id)){
                   next();
               } else {
                   req.flash("error", "Non sei il proprietario di questo post");
                   res.redirect("/posts");
               }
           }
        });
    } else {
        req.flash("error", "Devi essere iscritto per poterlo fare");
        res.redirect("/login");
    }
}

//LISTENER
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("BLOG ONLINE");
})