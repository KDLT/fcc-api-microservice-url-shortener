'use strict';

var express = require('express');
var app = express();
var mongo = require('mongodb');
var mongoose = require('mongoose');
const dns = require('dns');

var cors = require('cors');


// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
console.log(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGOLAB_URI);

// var personSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   age: Number,
//   favoriteFoods: [{type: String}]
// });

// var Person = mongoose.model('Person', personSchema);

app.use(cors());
app.use(loggerMiddleware);

function loggerMiddleware(req, res, next) { // mounting the root level middleware
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
}

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

// process.cwd() -> current working directory, parang __dirname
app.use('/public', express.static(process.cwd() + '/public'));
app.get('/', function(req, res) { // sending the index.html file
  res.sendFile(process.cwd() + '/views/index.html');
});
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


const linkSchema = new mongoose.Schema({
  original_link: {type: String, required: true},
  hostname: String,
  short_url: Number
});
const Link = mongoose.model('Link', linkSchema);
var index = 0;
const handleError = err => console.log(err.message);

const createLink = (original, hostname, index) => (
  Link.create({
    original_link: original,
    hostname: hostname,
    short_url: index
  })
);

// const findMaxCount = () => {
//   let count = Link.find({})
//       .sort('-short_url')
//       .limit(1)
//       .select('short_url')
//       .exec(function(err, linkCount) {
//         console.log('linkCount in exec: ',linkCount);
//         console.log('linkCount.length in exec: ',linkCount.length);
//         if (err) {
//           console.log('may error sa findmaxshorturl')
//           handleError(err) 
//         } else {
//           if (linkCount.length === 0) {
//             return 0;
//           } else {
//             return linkCount[0].short_url
//           }
//         }
//       });
//   console.log('count: ', count);
//   return count;
// };

const findLinkCount = (original, hostname, res) => {
  Link.estimatedDocumentCount({}, function(err, count) {
    console.log('count in findLinkCount: ', count)
    if (err) { 
      handleError(err) 
    } else {
      createLink(original, hostname, count+1);
      res.json({"original_url": original, "short_url": count+1})
    }
  });
}

app.post('/api/shorturl/new', function(req, res) {
  // console.log('req.body.url : ', req.body.url); // value of input form
  // console.log('typeof req.body.url: ', typeof req.body.url); // string
  let url = req.body.url.replace(/(^\w+:|^)\/\/[www\.]*/g, '');
  dns.lookup(url, function(err, address, family) {
    console.log({address, family});
    if (address) { // valid address
      // sa loob nito mangyayari ang Link.create(...)
      // dito na rin sa findLinkCount magrerespond kaya pinasa dito 'yung res
      findLinkCount(req.body.url, url, res)
    } else res.json({error: "Invalid URL"})
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  // res.json({'goto': req.params.short_url})
  Link.findOne({ short_url: req.params.short_url}, function(err, entryData) {
    if (err) { handleError(err) }
    else res.redirect('https://www.' + entryData.hostname)
    // err ? handleError(err) : console.log('from short_url', entryData)
  });
});

// var queryChain = function(done) {
//   console.log('starting models:', Person.find({}));
//   var foodToSearch = "burrito";
//   Person.find({favoriteFoods: foodToSearch})
//         .sort({name: 'asc'}) // can also be written as .sort('name')    .sort('-name') for reverse order
//         .limit(2)
//         .select('-age') // can also be written in object notation .select({age: true})
//         .exec(function(error, manipulatedData) {
//           if (error) { return done(error, manipulatedData) }
//           else {
//             console.log(manipulatedData);
//             return done(null, manipulatedData);
//           };
//         })


// Tank.create({ size: 'small' }, function (err, small) {
//   if (err) return handleError(err);
//   // saved!
// });

 // Person.findOne({"favoriteFoods": food}, function(error, person) {
 //    error ? done(error) : done(null, person);
 //  });  

// Character.findOne({ name: 'Frodo' }, function(err, character) {
//   console.log(character); // { name: 'Frodo', inventory: { ringOfPower: 1 }}
// });

app.listen(port, function () {
  console.log('Node.js listening ...');
});