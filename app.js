require("dotenv").config();//to use environment variables
//const md5 = require('md5');//for hashing password
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require('lodash');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const bcrypt = require('bcrypt');

const saltrounds = 10;

const  homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb+srv://admin-chirag:"+process.env.DB_PASSWORD+"@cluster0.loj7j.mongodb.net/blogWebsitedb",{
  useNewUrlParser: true,
  useUnifiedTopology: true
 });

const UserDetailSchema = new mongoose.Schema({
  _email : {
    type : String,
    required : true,
    unique : true,
    sparse : true
  },
  _username : {
    type : String,
    required : true,
    unique : true,
    sparse : true
  },
  _password : {
    type : String,
    required : true,
  },
  _blogs : []
})


//UserDetailSchema.plugin(encrypt,{secret : process.env.SECRET,encryptedFields : ["_password"]});//to encrypt username and password
const UserDetail = mongoose.model("UserDetail",UserDetailSchema);

app.get("/",function(req,res){
  res.render("index",{})
})

app.get("/signup",function(req,res){
  res.render("signup",{
    text1 : ""
  })
})

app.post("/signup",function(req,res){

  bcrypt.hash(req.body.password,saltrounds,function(err,hash){
    const user = new UserDetail({
      _email : req.body.email,
      _username : req.body.username,
      _password : hash
    });

     user.save(function(err){
      if(err){
        console.log(err);
        res.render("signup",{
          text1 : "Username or Email Already Registered"
        })
      }else{
        res.render("login",{
          text1 : "SignedUp Successfully",
          text2 : ""
        })
      }
    })
  });

})

app.get("/login",function(req,res){
  res.render("login",{
    text1: "",
    text2 : ""
  })
})

app.post("/login",async function(req,res){
    UserDetail.findOne({_username : req.body.username},function(err,founduser){
      if (founduser) {
        bcrypt.compare(req.body.password,founduser._password,function(err,result){
          if(result === true){
            localusername = req.body.username;
            res.render("home",{
              content : homeStartingContent,
              blogs : founduser._blogs,
            })
          }else{
            res.render("login",{
              text1 : "",
              text2 : "Username or Password is Invalid!"
            })
          }
        })
      }
      else{
        res.render("login",{
          text1 : "",
          text2 : "Username or Password is Invalid!"
        })
      }
    });
})

app.get("/home",function(req,res){
  UserDetail.findOne({_username : localusername},function(err,founduser){
    res.render("home",{
      content : homeStartingContent,
      blogs : founduser._blogs,
      localusername  : localusername
    })
  })
})

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

app.get("/compose",function(req,res){
  res.render("compose",{});
})

app.post("/compose",function(req,res){
  UserDetail.findOne({_username : localusername},function(err,founduser){
    let post = {
       title : req.body.blogTitle,
       text : req.body.blogText
    };
    founduser._blogs.push(post);
    founduser.save();
    res.redirect("/home");
  })

})

app.get("/posts/:testid",function(req,res){
  UserDetail.findOne({_username : localusername},function(err,founduser){
    for (var i = 0; i < founduser._blogs.length; i++) {
      if (founduser._blogs[i].title === req.params.testid) {
        console.log(founduser._blogs[i].title);
        res.render("post",{
          blog : founduser._blogs[i]
        })
      }
    }
  })

})

app.listen(3000,function(req,res){
  console.log("Server Started Successfully!!");
})
