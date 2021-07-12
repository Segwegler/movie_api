const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");

const app = express();

const movies = [
    {"name":"A Knight's Tale", "director":"Brian Helgeland", "description":"A boy goes on a quest to change his stars","genre":"Romance/Action/Comedy"},
    {"name":"The Princess Bride", "director":"Rob Reiner", "description":"A story about fighting for true love", "genre":"Romance/Action/Comedy"},
    {"name":"John Wick", "director": "Chad Stahelski", "description":"While mourning his wifes death an ex hit-man reenters his old world to seek revenge for the death of his dog", "genre":"dark/action/cathartic"},
    {"name":"Whisper of the Heart", "director":"Yoshifumi Kondo","description":"Inspired by new found love, Shinzuku embarks on a path of self-discovery to follow her dream.","genre":"heartfelt/romance/"},
    {"name":"Seven Pounds", "director":"Gabriele Muccino", "description":"Racked with guilt over past actions Ben seeks to change the life of seven strangers", "genre":"Drama/Romance"},
    {"name":"Blade", "director":"Stephen Norrington", "description":"Blade, half vampire and half human, seeks revenge for the death of his mother by hunting vampires", "genre":"Superhero/Action"},
    {"name":"Baby Driver", "director":"Edgar Wright", "description":"After stealing a car when he was a child Baby is stuck paying back Doc by being his go-to driver for heists. Baby wants out.", "genre":"Action/Thriller"},
    {"name":"Galaxy Quest", "director":"Dean Parisot", "description":"Washed up sifi tv show actors are recruted by aliens who need their help abord a ship based on their show.", "genre":"Sci-fi/Adventure"},
    {"name":"The Secret Life of Walter Mitty", "director":"Ben Stiller", "description":"Breaking free from his routine Walter embarks on a journey to find the quintessence of Life", "genre":"Comedy/Adventure"},
    {"name":"Léon: The Professional", "director":"Luc Besson", "description":"A hit man saves the life of a girl who lives down the hall. She tries to convince him to help her get revenge for the death of her family.", "genre":"Action/Drama"},
    {"name":"Knives Out", "director":"Rian Johnson", "description":"The circumstances surrounding the death of crime novelist Harlan Thrombey are mysterious, but there's one thing that renowned Detective Benoit Blanc knows for sure -- everyone in the wildly dysfunctional Thrombey family is a suspect. Now, Blanc must sift through a web of lies and red herrings to uncover the truth.", "genre":"Mystery/Crime"}
  ];
const people = [
  {
    "name":"Joe Smith",
    "dob":"12-25-1499",
    "dod":"12-25-5523",
    "bio":"Was alive then died along time after",
    "director":true
  },
  {
    "name":"Herb Walters",
    "dob":"12-25-1499",
    "dod":"12-25-5523",
    "bio":"Was alive then died along time after",
    "director":false
  },
];

let users = [];


app.use(bodyParser.json());

app.use(morgan("common"));

app.get("/movies", (req, res)=> {
  res.json(movies);
});

app.get("/movies/:name", (req, res)=>{
  res.json(movies.find((movie) => { return movie.name === req.params.name }));
});

app.get("/movies/:name/genre", (req, res) => {
  res.send(movies.find((movie) => {  return movie.name === req.params.name }).genre);
});

app.get("/director/:name", (req, res) => {
  res.json(people.find((person) => {return (person.name === req.params.name  && person.director)} ))
});

app.post("/user", (req, res) => {
  let newUser = req.body;
  if(!newUser.name){
    const message = "missing name in request body";
    res.status(400).send(message);
  }else{
    newUser.id = users.length.toString();// will use uuid.v4();
    newUser.list = [];
    users.push(newUser);
    res.status(201).send(newUser);
  }
});

app.put("/user", (req, res) => {
  let update = req.body;
  let user = users.find((u) => {return update.id === u.id});
  if(user){
    Object.keys(update).forEach((key) => {user[key] = update[key]} );
    res.json(user);
  }else{
    res.send("No user with that ID");
  }

});


//get users
//ffor testing
app.get("/users", (req, res) => {
  res.json(users);
});

app.put("/user/list", (req, res) => {
  let update = req.body;
  let user =  users.find((u) => {return update.id === u.id});
  if(user){
    if(!user.list.includes(update.movie)){
      user.list.push(update.movie);
      res.send(update.movie + " was added to your list");
    }else{
      res.send("That movie is already in the list");
    }

  }else{
    res.send("No user with that ID");
  }
});

app.delete("/user/list", (req, res) => {
  let update = req.body;
  let user =  users.find((u) => {return update.id === u.id});
  if(user){
    if(user.list.includes(update.movie)){

      user.list = user.list.filter((movie) => { return movie !== update.movie});
      res.send(`${update.movie} has been removed from your favorites`)
    }
  }else{
    res.send("No user with that ID");
  }
});

app.delete("/user/:id", (req, res) => {
  let user = users.find((user)=> {return user.id === req.params.id});
  if(user){
    users = users.filter((obj) => {return obj.id !== req.params.id});
    res.status(201).send(`User ${req.params.id} was deleted.`);
  }else{
    res.status(404).send(`User with the id ${req.params.id} was not found`);
  }
});

app.get("/", (req, res) =>{
  res.send("Welcome to my movie API!<br><a href=\"/documentation.html\">Docs</a>");
});

app.use(express.static("public"));


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("somthing broke!");
});



app.listen(8080, () => {
  console.log("Listening on port 8080");
});
