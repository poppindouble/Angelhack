function storeAndReturnTags() {
	console.log("tag it clicked");
	var ajax = ajax_call();
    ajax.success(function(response) {
    console.log(response);
    json = JSON.stringify(response);
   //creates a base-64 encoded ASCII string
   json = btoa(json);
   //save the encoded accout to web storage
   localStorage.setItem('tags', json);
   return response;

});
}

function getTagsFromStorage(){
   var json = localStorage.getItem('tags');
   if (!json) return false;
   localStorage.removeItem('tags');
   //decodes a string data encoded using base-64
   json = atob(json);
   //parses to Object the JSON string
   var tags = JSON.parse(json);
   //do what you need with the Object
   return tags;
}

function ajax_call() {
    return $.ajax({
    url: 'http://localhost:3000/clarifai',
    type: 'POST',
    async: 1,
    error: function() {
        alert("Error occured")
    }
});
}