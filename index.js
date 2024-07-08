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
  username: String
});

let User = mongoose.model("User", userSchema);

app.post("/api/users", (req, res) => {
  let username = req.body.username;
  let newUser = new User({username: username});
  newUser.save();
  res.json(newUser);
})

app.get("/api/users", (req, res) => {
  User.find({}, '_id username', function(err, data){
    if (err) return console.error(err);
    res.json(data);
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
