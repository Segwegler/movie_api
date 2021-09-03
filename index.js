const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");

const mongoose = require("mongoose");
const Models = require("./models.js");

const cors = require("cors");

const { check, validationResult } = require("express-validator");

const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect("mongodb://localhost:27017/myFlixDB", {useNewUrlParser: true, useUnifiedTopology: true});

mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const app = express();

let allowedOrigins = ["http://localhost:8080",
                      "http://localhost:1234",
                      "https://nsegler-myflix.netlify.app/"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      let message = 'The CORS policy for this application does not allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

app.use(bodyParser.json());

let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");


app.use(morgan("common"));

//returns a list of all movies
//returns a json object
app.get("/movies", (req, res)=> {
  Movies.find().then((movies) => {
    res.status(200).json(movies);
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  });
});

//returns specific movie
//returns a json object
app.get("/movies/:title", (req, res)=>{
  //res.json(movies.find((movie) => { return movie.name === req.params.title }));
  Movies.findOne({Title: req.params.title}).then((movie) => {
    if(movie){
      res.status(200).json(movie);
    }else{
      res.status(404).send("A movie with that title was not found");
    }

  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  });

});

//returns information on a genre
//returns a json object
app.get("/movies/genre/:Genre", (req, res) => {
  Movies.findOne({"Genre.Name": req.params.Genre}).then((movie) =>{
    if(movie){
      res.status(200).json(movie.Genre);
    }else{
      res.status(400).send(`Genre: ${req.params.Genre}  not found`);
    }
  }).catch((error) =>{
    console.error(error);
    res.status(500).send("Error: " + error);
  });
});

//gets information on a director
//returns a json object
app.get("/movies/director/:Name", (req, res) => {
  Movies.findOne({"Director.Name": req.params.Name}).then((movie) =>{
    if(movie){
      res.status(200).json(movie.Director);
    }else{
      res.status(400).send(`Director: ${req.params.Name}  not found`);
    }
  }).catch((error) =>{
    console.error(error);
    res.status(500).send("Error: " + error);
  });
});


//Add a user
//expects a json object
//Username must be alphanumeric
//Password must be at least 8 characters long
//Email must be a well formatted email
app.post("/users",
  [
    check("Username","Username is required").not().isEmpty(),
    check("Username", "Username can only contain letters and numbers").isAlphanumeric(),
    check("Password","Password must be at least 8 characters long").isLength({min:8}),
    check("Email","Email does not appear to be valid").isEmail()
  ], (req, res) => {
  let errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(422).json({errors: errors.array()});
  }

  //hashes password so plaintext will not be stored in the database
  let hashedPassword = Users.hashPassword(req.body.Password);

  //creates user if Username is not already taken
  Users.findOne({Username: req.body.Username}).then((user) => {
    if(user){
      return res.status(400).send(req.body.Username + " already exists");
    }else{
      Users.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }).then((user) => {res.status(201).json(user)}).catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      })
    }
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  });
});

//Update user data
//Expects a Username parameter and json object
//json object only needs the information that is to be updated
//available fields to update are:  Username, Password, Email, and Birthday
app.put("/users/:Username",[
  check("Username", "Username can only contain letters and numbers").optional().isAlphanumeric(),
  check("Password","Password must be at least 8 characters long").optional().isLength({min:8}),
  check("Email","Email does not appear to be valid").optional().isEmail()
], passport.authenticate("jwt",{session:false}), (req, res) => {
  //check that the user making the request owns the account
  if(req.user.Username !== req.params.Username){
    console.warn(`User:"${req.user.Username}" tried to acces account information for user:"${req.params.Username}"`)
    res.status(403).send("You can not make changes to an account that is not yours");
    return;
  }
  //create an opject to send with the update request
  let update = {};
  if(req.body.Username)
    update.Username = req.body.Username;
  if(req.body.Password)
    update.Password = Users.hashPassword(req.body.Password);
  if(req.body.Email)
    update.Email = req.body.Email;
  if(req.body.Birthday)
    update.Birthday = req.body.Birthday

  //checks to see if there are errors from validation
  let errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).json({errors: errors.array()});
  }

  //sends the update request
  Users.findOneAndUpdate(
    {Username: req.params.Username},
    { $set: update},
    {new: true},
    (err, updatedUser) =>{
      if(err){
        console.error(err);
        res.status(500).send("Error: "+ err);
      }else{
        res.json(updatedUser);
      }
    }
  );//end find and update
});

//get users
//returns a json list of users
//the list that is returned has sensitive information removed ie: Passwordm, _id, and Email
app.get("/users", passport.authenticate("jwt",{session:false}), (req, res) => {
  Users.find().lean().then((users) => {
    //removes private data from being sent to any logged in user
    users.forEach(function(user){
      delete user.Password;
      delete user._id;
      delete user.Email;
      delete user.__v;
    });

    res.status(200).json(users);
  }).catch((error) =>{
    console.error(error);
    res.status(500).send("error: " + error);
  });
});

//Get a single users data back
//returns a json object
//omits password id and email if the logged in user is looking up someone else
app.get("/users/:Username", passport.authenticate("jwt",{session:false}), (req,res) => {

  Users.findOne({Username: req.params.Username}).then((user) => {
    if(user){
      if(req.user.Username !== req.params.Username){
        user = user.toJSON();
        delete user.Password;
        delete user._id;
        delete user.Email;
        delete user.__v;
      }
      res.status(200).json(user);

    }else{
      res.status(404).send("User not found");
    }
  }).catch((error) =>{
    console.error(error);
    res.status(500).send("error: " + error);
  });
})

//add a movie to a users favorites list
app.post("/users/:Username/movies/:MovieID", passport.authenticate("jwt",{session:false}), (req, res) =>{
  //check that the user making the request owns the account
  if(req.user.Username !== req.params.Username){
    console.warn(`User:"${req.user.Username}" tried to acces account information for user:"${req.params.Username}"`)
    res.status(403).send(`You can not make changes to an account that is not yours`);
    return;
  }
  Users.findOneAndUpdate(
    {Username: req.params.Username},
    {$push: {FavoriteMovies: req.params.MovieID}},
    {new : true},
    (error, updatedUser) => {
      if(error){
        console.error(error);
        res.status(500).send("Error: " + error);
      }else{
        res.json(updatedUser);
      }
    }
  );
});

//remove a movie to a users favorites list
app.delete("/users/:Username/movies/:MovieID", passport.authenticate("jwt",{session:false}), (req, res) =>{
  //check that the user making the request owns the account
  if(req.user.Username !== req.params.Username){
    console.warn(`User:"${req.user.Username}" tried to acces account information for user:"${req.params.Username}"`)
    res.status(403).send(`You can not make changes to an account that is not yours`);
    return;
  }
  Users.findOneAndUpdate(
    {Username: req.params.Username},
    {$pull: {FavoriteMovies: req.params.MovieID}},
    {new : true},
    (error, updatedUser) => {
      if(error){
        console.error(error);
        res.status(500).send("Error: " + error);
      }else{
        res.json(updatedUser);
      }
    }
  );
});

//remove a user from the database
app.delete("/users/:Username", passport.authenticate("jwt",{session:false}), (req, res) => {
  //check that the user making the request owns the account
  if(req.user.Username !== req.params.Username){
    console.warn(`User:"${req.user.Username}" tried to acces account information for user:"${req.params.Username}"`)
    res.status(403).send(`You can not make changes to an account that is not yours`);
    return;
  }
  Users.findOneAndRemove({Username: req.params.Username}).then((user) =>{
    if(!user){
      res.status(400).send("User: "+req.params.Username + " was not found");
    }else{
      res.status(200).send(req.params.Username + " was deleted.");
    }
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  });
});

//get the default page
app.get("/", (req, res) =>{
  res.send("Welcome to my movie API!<br><a href=\"/documentation.html\">Docs</a>");
});

//route unknown requests here before sending error if they dont exist
app.use(express.static("public"));


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("somthing broke!");
});

//set port to either the specified enviernment variable or 8080
const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log("Listening on port 8080");
});
