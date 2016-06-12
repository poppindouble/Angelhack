
var MODE = 'DRAW';

// for buttons
function uploadImageClicked() {
	console.log("upload image clicked");
}

function colourItClicked() {
	console.log("colour image clicked");
}

function tagItClicked() {
	console.log("tag it clicked");
	var ajax = ajax_call();
    ajax.success(function(response) {
    console.log(response);
    json = JSON.stringify(response);
   //creates a base-64 encoded ASCII string
   json = btoa(json);
   //save the encoded accout to web storage
   localStorage.setItem('tags', json);
    window.location.href = 'file:///Users/rowandempster/git/Angelhack/WebApp/tag_it.html';

});
}

function ajax_call() {
    return $.ajax({
    url: 'http://localhost:3000/test',
    type: 'POST',
    async: 1,
    error: function() {
        alert("Error occured")
    }
});
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
            	imgData: imageURL
            },
            async:true,
            crossDomain:true,
            success: function(data, status, xhr) {

            }
    });
}

// for sliders
function changeThickness(value) {
	thickness = value;
	console.log("changeThickness", thickness)
	// post to the sever about thickness


	$.ajax({
            type: "POST",
            url: 'http://localhost:3000/thickness',
            data:{
            	thickness: thickness
            },
            async:true,
            crossDomain:true,
            success: function(data, status, xhr) {

            }
    });


}

function changeGreyness(value) {
	greyness = value;
	console.log("changeGreyness", greyness)
	// post to the sever about greyness

	$.ajax({
            type: "POST",
            url: 'http://localhost:3000/greyness',
            data:{
            	greyness: greyness
            },
            async:true,
            crossDomain:true,
            success: function(data, status, xhr) {

            }
    });


}

// vibrance
function vibranceSliderOnChange(newValue) {
	console.log("vibranceSliderOnChange", newValue);
	// post to the server about vibrance
	var vibrance = newValue



	$.ajax({
            type: "POST",
            url: 'http://localhost:3000/vibrance',
            data:{
            	vibrance: vibrance
            },
            async:true,
            crossDomain:true,
            success: function(data, status, xhr) {

            }
    });




}

function vibranceSliderChanging(newValue) {
	console.log("vibranceSliderChanging", newValue);	
}

// hue

function hueSliderOnChange(newValue) {
	var hue = newValue
	console.log("hueSliderOnChange", newValue)
	// post to the server about hue


	$.ajax({
            type: "POST",
            url: 'http://localhost:3000/hue',
            data:{
            	hue: hue
            },
            async:true,
            crossDomain:true,
            success: function(data, status, xhr) {

            }
    });


}


function hueSliderChanging(newValue) {
	console.log("hueSliderChanging", newValue)
}

// saturation

function saturationSliderOnChange(newValue) {

	var saturation = newValue


	console.log("saturationSliderOnChange", newValue)
	// post to the server about saturation


	$.ajax({
            type: "POST",
            url: 'http://localhost:3000/saturation',
            data:{
            	saturation: saturation
            },
            async:true,
            crossDomain:true,
            success: function(data, status, xhr) {

            }
    });



}

function saturationSliderChanging(newValue) {
	console.log("saturationSliderChanging", newValue)
}

// colour sample rate

function colourSampleRateSliderOnChange(newValue) {

	var colourSampleRate = newValue


	console.log("colourSampleRateSliderOnChange", colourSampleRate)
	// post to the server about colour sample rate

	$.ajax({
            type: "POST",
            url: 'http://localhost:3000/colourSampleRate',
            data:{
            	colourSampleRate: colourSampleRate
            },
            async:true,
            crossDomain:true,
            success: function(data, status, xhr) {

            }
    });


	
}

function colourSampleRateSliderChanging(newValue) {
	console.log("colourSampleRateSliderChanging", colourSampleRateSliderChanging)
}



