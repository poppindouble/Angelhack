function sendTweet(meesage) {
	var ajax = ajax_call(messasge);
}

function ajax_call(message) {
    return $.ajax({
    url: 'http://localhost:3000/test',
    type: 'POST',
    data:{
        message: message
    },
    async: 1,
    error: function() {
        alert("Error occured")
    }
});
}