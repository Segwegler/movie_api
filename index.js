const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");

const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect("mongodb://localhost:27017/myFlixDB", {useNewUrlParser: true, useUnifiedTopology: true});


const app = express();


app.use(bodyParser.json());

let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");


app.use(morgan("common"));

app.get("/movies",passport.authenticate("jwt",{session:false}), (req, res)=> {
  Movies.find().then((movies) => {
    res.status(200).json(movies);
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Error: " + error);
  });
});

app.get("/movies/:title",passport.authenticate("jwt",{session:false}), (req, res)=>{
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

app.get("/movies/genre/:Genre", passport.authenticate("jwt",{session:false}), (req, res) => {
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

app.get("/movies/director/:Name", passport.authenticate("jwt",{session:false}), (req, res) => {
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
/* We'll expect JSON in this format
{
  ID:int,
  username: string,
  password: string,
  email: string,
  birthday: date,
}
*/
app.post("/users", (req, res) => {
  Users.findOne({Username: req.body.Username}).then((user) => {
    if(user){
      return res.status(400).send(req.body.Username + " already exists");
    }else{
      Users.create({
        Username: req.body.Username,
        Password: req.body.Password,
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


app.put("/users/:Username", passport.authenticate("jwt",{session:false}), (req, res) => {
  let update = {};
  if(req.body.Username)
    update.Username = req.body.Username;
  if(req.body.Password)
    update.Password = req.body.Password;
  if(req.body.Email)
    update.Email = req.body.Email;
  if(req.body.Birthday)
    update.Birthday = req.body.Birthday
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
//ffor testing
app.get("/users", passport.authenticate("jwt",{session:false}), (req, res) => {
  Users.find().then((users) => {res.status(201).json(users);
  }).catch((error) =>{
    console.error(error);
    res.status(500).send("error: " + error);
  });
});

//Get a single users data back
app.get("/users/:Username", passport.authenticate("jwt",{session:false}), (req,res) => {
  Users.findOne({Username: req.params.Username}).then((user) => {
    if(user){
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



app.listen(8080, () => {
  console.log("Listening on port 8080");
});
