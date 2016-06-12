var express = require('express');
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');
var shell = require('shelljs');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



app.get('/', function (req, res) {
  res.send('Hello World!');
});



app.post('/write', function (req, res) {
	var img = req.body.imgData
	var data = img.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	fs.writeFile('image.png', buf, function(error) {
    if(error) {
      console.log("we have error")
    } else {
      console.log("call the script")
      shell.exec('python colour.py', function(status, stdout, stderr) {
        console.log(status);
        console.log(stdout);
        console.log(stderr);
      });
    }
  });



  res.send('POST request to the homepage');
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
