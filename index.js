const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')

let mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {useUnifiedTopology: true});

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {type: String, required: true}
});

const exerciseSchema = new Schema({
  userid: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: new Date()}
})

let User = mongoose.model("User", userSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema);

//save a user to the database and return the resulting object to the user
app.post("/api/users", (req, res) => {
  let username = req.body.username;
  let newUser = new User({username: username});
  newUser.save();
  res.json(newUser);
})

//gets a list of all users in the database with their ids
app.get("/api/users", (req, res) => {
  User.find({}, '_id username', function(err, data){
    if (err) return console.error(err);
    res.json(data);
  })
})

//handle a get request for logs for a particular user (userid is a parameter in the request)
app.get("/api/users/:_id/logs", (req, res) => {
  let userid = req.params._id;
  
  //construct a query
  let query = {
    userid: userid,
  }
  //grab the optional parameters from the query
  let limit = req.query.limit;
  let from = req.query.from;
  let to = req.query.to;

  //if the limit parameter exists, we have to parse it as a number
  if (limit){
    limit = parseInt(limit);
  }

  //if either to or from exist, we need to use them to filter the query, which we do by adding them to our query object
  if (from){
    query.date = {};
    query.date['$gte'] = from;
  }
  if (to){
    if (!query.date){
      query.date = {};
    }
    query.date['$lte'] = to;
  }
  
  //query the database
  Exercise.find(query, 'description duration date -_id').limit(limit).exec(function(err, exercises){
    if (err) return console.error(err);

    //need to change the date in the exercises to a string before returning it
    exercises = exercises.map((x) => {
      return {
        description: x.description,
        duration: x.duration,
        date: x.date.toDateString()
      }
    })

    //need to query again to get the user's name
    User.findById(userid, 'username', function(err, user){
      res.json({
        username: user.username,
        count: exercises.length,
        _id: userid,
        log: exercises
      })
    })
  })
})

//post a new exercise to the database
app.post("/api/users/:_id/exercises", (req, res) => {
  //first get all the info
  let userid = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  //date is optional
  let date;
  if (req.body.date){
    date = req.body.date;
  }

  //check if the user is in the database - post fails if user is not found
  User.findById(userid, function(err, user){
    if (err) return console.error(err);
    //console.log(user);

    //create a new exercise and save it to the database
    //if required fields are missing, the post fails
    let newExercise = new Exercise({
      userid: userid,
      description: description,
      duration: duration,
      date: date
    })

    newExercise.save(function(err, exercise){
      if (err) return console.error(err);
      //if the post succeeds, send required information back to user in json format
      res.json({
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
        _id: user._id
      })
    });
  });  
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
