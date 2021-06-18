require("dotenv").config();//to use environment variables
//const md5 = require('md5');//for hashing password
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require('lodash');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const saltrounds = 10;

const  homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//*********************************************Maintain Order from Now************************************
app.use(session({
  secret : "its my secret",
  resave : false,
  saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());
//*********************************************MongoDB Code************************************

mongoose.connect("mongodb+srv://admin-chirag:"+process.env.DB_PASSWORD+"@cluster0.loj7j.mongodb.net/blogWebsitedb",{
  useNewUrlParser: true,
  useUnifiedTopology: true
 });
 mongoose.set('useCreateIndex',true);

const UserDetailSchema = new mongoose.Schema({
  email : {
    type : String,
  },
  username : {
    type : String,
    unique : true,
    required : true
  },
  password : {
    type : String,
  },
  blogs : []
})

UserDetailSchema.plugin(passportLocalMongoose);//used for hash and salt of passport and to save into server
UserDetailSchema.plugin(findOrCreate);//used to sign in using google
const UserDetail = mongoose.model("UserDetail",UserDetailSchema);

passport.use(UserDetail.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    UserDetail.findOrCreate({ username: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//*********************************************Maintain Order Upto Now************************************


app.get("/",function(req,res){
  res.render("index",{  })
})

app.get("/login/auth/google",
  passport.authenticate("google",{scope : ["profile"]})
)
app.get('/auth/google/home',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });

app.get("/about",function(req,res){
  res.render("about",{
    content : aboutContent
  })
})

app.post("/articles",function(req,res){
  console.log(req.body.title);
  console.log(req.body.content);
})

app.get("/contact",function(req,res){
  res.render("contact",{
    content : contactContent
  })
})
//************************************************SignUp Login And Compose**********************************

app.get("/signup",function(req,res){
  res.render("signup",{
    text1 : ""
  })
})

app.post("/signup",function(req,res){
   UserDetail.register(
     {email:req.body.email,username : req.body.username},req.body.password,function(err,user){
     if(err){
       console.log(err);
       res.render("signup",{
         text1 : "Username or Email Already Registered!"
       })
     }else{
        const user = new UserDetail({
          email : req.body.email,
          username : req.body.username,
          password : req.body.password
        })
        user.save();
        res.render("login",{
          text1 : "Registered User Successfully",
          text2 : ""
        })
     }
   })

})

app.get("/login",function(req,res){
  res.render("login",{
    text1:"",
    text2 : ""
  })
})

app.get("/home",function(req,res){
  if(req.user && req.isAuthenticated){
    UserDetail.findOne({username : req.user.username},function(err,founduser){
      res.render("home",{
        content : homeStartingContent,
        blogs : founduser.blogs,
      })
    })
  }else{
    res.render("login",{
      text1 : "Login to access Home Page",
      text2 : ""
    })
  }
})

app.get("/compose",function(req,res){
  if(req.user && req.isAuthenticated){
  res.render("compose",{});
}else{
  res.render("login",{
    text1 : "Login to Compose and post blogs",
    text2 : ""
  })
}
})

app.post("/login",async function(req,res){
 const user = new UserDetail({
   username : req.body.username,
   password : req.body.password
 })
  req.login(user,function(err){
    if(err){
        console.log("entered here error");
      console.log(err);
      res.redirect('/login');
    }else{
        console.log("entered here auth");
            passport.authenticate('local')(req,res,function(){
                   res.redirect("/home");
              })
            }
        })
      })

// app.post('/login',passport.authenticate('local', {
//   successRedirect: '/home',
//   failureRedirect: '/login',
//   failureFlash: req.flash('error','Invalid Username Or Password') })
// );

app.post("/compose",function(req,res){
  if(req.user && req.isAuthenticated){
    UserDetail.findOne({username : req.user.username},function(err,founduser){
      let post = {
         title : req.body.blogTitle,
         text : req.body.blogText
      };
      founduser.blogs.push(post);
      founduser.save();
      res.redirect("/home");
    })
  }else{
    res.render("login",{
      text1 : "Login to Compose and post blogs",
      text2 : ""
    })
  }

})

app.get("/posts/:testid",function(req,res){
  UserDetail.findOne({username : req.user.username},function(err,founduser){
    for (var i = 0; i < founduser.blogs.length; i++) {
      if (founduser.blogs[i].title === req.params.testid) {
        console.log(founduser.blogs[i].title);
        res.render("post",{
          blog : founduser.blogs[i]
        })
      }
    }
  })
})

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
})

app.listen(3000,function(req,res){
  console.log("Server Started Successfully!!");
})
