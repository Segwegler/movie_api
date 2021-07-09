const express = require("express");
const morgan = require("morgan");
const app = express();

const top_movies = {
  "movies":[
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
  ]
};


app.use(morgan("common"));

app.get("/movies", (req, res)=> {
  res.json(top_movies);
});

app.get("/", (req, res) =>{
  res.send("Welcome to my movie API!");
});

app.use(express.static("public"));


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("somthing broke!");
});



app.listen(8080, () => {
  console.log("Listening on port 8080");
});
