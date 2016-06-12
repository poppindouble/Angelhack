$(document).ready(
    function() {
        $('div.total-title').text(loadData);
    }
);


function loadData() {
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

