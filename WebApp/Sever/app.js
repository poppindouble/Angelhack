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

  var vibrance = req.body.vibrance
  var hue = req.body.hue
  var saturation = req.body.saturation
  var colourSampleRate = req.body.colourSampleRate



	var data = img.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	fs.writeFile('image.png', buf, function(error) {
    if(error) {
      console.log("we have error")
    } else {
      console.log("call the script")
      shell.exec('python colour.py image ' + colourSampleRate + " " + vibrance + " " + hue + " " + saturation, function(status, stdout, stderr) {
        console.log(status);
        console.log(stdout);
        console.log(stderr);
      });
    }
  });
})

app.post('/thickness', function (req, res) {
  var thickness = req.body.thickness
  console.log("thickness", thickness)
  res.send('POST request to the homepage');
});

app.post('/test', function (req, res) {
    shell.exec('python main.py "/Users/rowandempster/git/Angelhack/WebApp/Sever/image.png"', function(status, stdout, stderr) {
        console.log(stdout);
        res.end(stdout);
      });
});



app.post('/greyness', function (req, res) {
  var greyness = req.body.greyness
  console.log("greyness", greyness)


  res.send('POST request to the homepage');
});


app.post('/attributes', function (req, res) {
  var vibrance = req.body.vibrance
  var hue = req.body.hue
  var saturation = req.body.saturation
  var colourSampleRate = req.body.colourSampleRate

  console.log("vibrance", vibrance)
  console.log("hue", hue)
  console.log("saturation", saturation)
  console.log("colourSampleRate", colourSampleRate)


  shell.exec('python colour.py image ' + colourSampleRate + " " + vibrance + " " + hue + " " + saturation, function(status, stdout, stderr) {
        console.log(status);
        console.log(stdout);
        console.log(stderr);
      });



  res.send('POST request to the homepage');
});




// app.post('/vibrance', function (req, res) {
//   var vibrance = req.body.vibrance
//   console.log("vibrance", vibrance)

//   shell.exec('python colour.py image ' + vibrance, function(status, stdout, stderr) {
//         console.log(status);
//         console.log(stdout);
//         console.log(stderr);
//       });



//   res.send('POST request to the homepage');
// });



// app.post('/hue', function (req, res) {
//   var hue = req.body.hue
//   console.log("hue", hue)

//   shell.exec('python colour.py image ' + hue, function(status, stdout, stderr) {
//         console.log(status);
//         console.log(stdout);
//         console.log(stderr);
//       });



//   res.send('POST request to the homepage');
// });



// app.post('/saturation', function (req, res) {
//   var saturation = req.body.saturation
//   console.log("hue", saturation)


//   res.send('POST request to the homepage');
// });



// app.post('/colourSampleRate', function (req, res) {
//   var colourSampleRate = req.body.colourSampleRate
//   console.log("colourSampleRate", colourSampleRate)


//   res.send('POST request to the homepage');
// });




app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
