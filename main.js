var expressLogic = require('./lib/expressLogic');
var webSocketLogic = require('./lib/webSocketLogic');


console.log("starting app...")

var port = process.env.PORT || 8080;        // set our port

//App Modules =====================================================
//This is express html/cc/js serving
//and after that websocket hosting and serving
var server = expressLogic(port);
webSocketLogic(server);

console.log('Html and Websocket hosted on port ' + port);