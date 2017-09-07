var express    = require('express');        // call express
var fs = require('fs');
var app        = express();
var pug = require('pug');

//server as argument to run WebSocketServer on the same port
module.exports = function (port) {

// ROUTES FOR OUR API
// =============================================================================
app.get("/", function(req, res){
    console.log("home directory");
    fs.readFile('./public/index.pug', function (err, pugHtml) {
        if (err) {
            throw err;
        }
        //get function from index.pug
        var fn = pug.compile(pugHtml.toString());
        //change title message. YouAreUsingPug changes one if statement
        var html = fn();

        res.writeHeader(200, {"Content-Type": "text/html"});
        res.write(html);
        res.end();
    });
});


app.set('views', __dirname + '/public');
app.set('view engine', 'pug')
app.use(express.static('public')); // Allows for files in public to be accessible like so: "localhost:4000/login.html"

// START THE SERVER
// =============================================================================
var server = app.listen(port);

//we return server so we can pass it to webSocketLogic
return server;

} //end of export