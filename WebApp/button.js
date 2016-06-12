
var MODE = 'DRAW';
var vibrance;
var saturation;
var hue;
var colourSampleRate;
var img;
var fr;

// for buttons
function uploadImageClicked() {
	console.log("upload image clicked");
	$("input[id='my_file']").click();	
}

$("input[id='my_file']").change(function(event) {
	var file = event.target.files[0];
	fr = new FileReader();
	fr.onload = createImage;
	fr.readAsDataURL(file);

	getResult();

    //var fileName = event.target.files[0].name;
});



function createImage() {
	img = new Image();
	img.onload = imageLoaded;
	img.src = fr.result;
}

function imageLoaded() {
	var canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	var ctx = canvas.getContext("2d")
	ctx.drawImage(img,0,0);



	//var imageURl = canvas.toDataURL("image/png");
	
	var vibrance = document.getElementById("vibrance").value
	var saturation = document.getElementById("saturation").value
	var colourSampleRate = document.getElementById("colourSampleRate").value
	var hue = document.getElementById("hue").value


	$.ajax({
            type: "POST",
            url: 'http://localhost:3000/write',
            data:{
            	imgData: canvas.toDataURL("image/png"),
            	vibrance: vibrance,
            	hue: hue,
            	saturation: saturation,
            	colourSampleRate: colourSampleRate
            },
            async:true,
            crossDomain:true,
            success: function(data, status, xhr) {

            }
    });


	// loop web service call here

	


}


function colourItClicked() {
	console.log("colour image clicked");
}

function changeMode() {
	if (MODE === 'DRAW') {
		MODE = 'ERASE';
	} else {
		MODE = 'DRAW';
	}
	console.log('Changed mode to: ' + MODE);
}

function saveImageClicked() {

	var canvas = document.getElementById("canvas"); 
	var imageURL = canvas.toDataURL()

	$.ajax({
            type: "POST",
            url: 'http://localhost:3000/write',
            data:{
            	imgData: imageURL,
            	vibrance: vibrance,
            	hue: hue,
            	saturation: saturation,
            	colourSampleRate: colourSampleRate
            },
            async:true,
            crossDomain:true,
            success: function(data, status, xhr) {

            }
    });



	this.getResult()


}


function getResult() {
	$.get("http://localhost:3000/result", function(data, status){
		if (data === "not done") {
			console.log("not done")
			getResult();
		} else {

			console.log('quit')
			var resultImgElement = document.getElementById('result-img');
			resultImgElement.src = './Sever/result.png';
			$('#modal-button').click();
			// read file here
			//"./Sever/result.png"
		}
	})
}


// for sliders
function changeThickness(value) {
	thickness = value;
	console.log("changeThickness", thickness)
}

function changeGreyness(value) {
	greyness = value;
	console.log("changeGreyness", greyness)
}

// vibrance
function vibranceSliderOnChange(newValue) {
	console.log("vibranceSliderOnChange", newValue);
	// post to the server about vibrance


	hue = document.getElementById("hue").value
	saturation = document.getElementById("saturation").value
	colourSampleRate = document.getElementById("colourSampleRate").value
	vibrance = newValue

	// $.ajax({
 //            type: "POST",
 //            url: 'http://localhost:3000/attributes',
 //            data:{
 //            	vibrance: vibrance,
 //            	hue: hue,
 //            	saturation: saturation,
 //            	colourSampleRate: colourSampleRate
 //            },
 //            async:true,
 //            crossDomain:true,
 //            success: function(data, status, xhr) {

 //            }
 //    });
}

// hue

function hueSliderOnChange(newValue) {
	hue = newValue
	console.log("hueSliderOnChange", newValue)
	// post to the server about hue


	vibrance = document.getElementById("vibrance").value
	saturation = document.getElementById("saturation").value
	colourSampleRate = document.getElementById("colourSampleRate").value




	// $.ajax({
 //            type: "POST",
 //            url: 'http://localhost:3000/attributes',
 //            data:{
 //            	vibrance: vibrance,
 //            	hue: hue,
 //            	saturation: saturation,
 //            	colourSampleRate: colourSampleRate
 //            },
 //            async:true,
 //            crossDomain:true,
 //            success: function(data, status, xhr) {

 //            }
 //    });
}


// saturation

function saturationSliderOnChange(newValue) {
	saturation = newValue
	console.log("saturationSliderOnChange", newValue)



	vibrance = document.getElementById("vibrance").value
	hue = document.getElementById("hue").value
	colourSampleRate = document.getElementById("colourSampleRate").value





	// $.ajax({
 //            type: "POST",
 //            url: 'http://localhost:3000/attributes',
 //            data:{
 //            	vibrance: vibrance,
 //            	hue: hue,
 //            	saturation: saturation,
 //            	colourSampleRate: colourSampleRate
 //            },
 //            async:true,
 //            crossDomain:true,
 //            success: function(data, status, xhr) {

 //            }
 //    });



}


// colour sample rate

function colourSampleRateSliderOnChange(newValue) {
	colourSampleRate = newValue
	console.log("colourSampleRateSliderOnChange", colourSampleRate)
	// post to the server about colour sample rate

	vibrance = document.getElementById("vibrance").value
	hue = document.getElementById("hue").value
	saturation = document.getElementById("saturation").value


	// $.ajax({
 //            type: "POST",
 //            url: 'http://localhost:3000/attributes',
 //            data:{
 //            	vibrance: vibrance,
 //            	hue: hue,
 //            	saturation: saturation,
 //            	colourSampleRate: colourSampleRate
 //            },
 //            async:true,
 //            crossDomain:true,
 //            success: function(data, status, xhr) {

 //            }
 //    });


	
}



