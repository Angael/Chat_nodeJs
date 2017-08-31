var WebSocketServer = require("ws").Server;
var clientMap = new Array();
// wss.on('connection', function(ws, req) {
//   console.log(req.connection.remoteAddress);
// });

console.log("starting...");
var wss = new WebSocketServer({
  port:8001
});

// LIB escape message HTML
var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};
function escapeHtml (string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

// wss.on("connection", (ws, req) => {
//   let ip = req.connection.remoteAddress;
//   let temp = clientMap.set( ws, ip);
//   //console.log(temp)
//   ws.on('message', (message) =>{
//     console.log('received: %s', message);

//     var time = new Date();
//     //send to everybode except author of message
//     wss.clients.forEach(function each(client) {
//       if (client !== ws){
//         let clientIP = clientMap.get( client);
//         let timeStr = time.getHours().toString() + ":" + time.getMinutes().toString();
//         var obj = JSON.stringify( {time:timeStr, your:false, ip:clientIP, message:message} );
//         client.send(obj);
//       }
//     }); // send different version to author of message
//     let clientIP = clientMap.get( ws);
//     let timeStr = time.getHours() + ":" + time.getMinutes();
//     var obj = JSON.stringify( {time:timeStr, your:true, ip:clientIP, message:message} );
//     ws.send(obj);
//   });
// });
wss.on("connection", (ws, req) => {
  let ip = req.connection.remoteAddress;
  let temp = clientMap.push( {ws:ws, ip:ip} );
  console.log("length "+temp)
      //testloop
      clientMap.forEach((element, index)=>{
        console.log(index+"# "+element.ip);
        }
      );
  ws.on('message', (message) =>{
    console.log('received: %s', message);
    let escMessage = escapeHtml(message);
    var time = new Date();
    //send to everybode except author of message
    clientMap.forEach((element, index)=>{
      if (element.ws !== ws){
        let timeStr = time.getHours().toString() + ":" + time.getMinutes().toString();
        var obj = JSON.stringify( {time:timeStr, your:false, ip:ip, message:escMessage} );
        console.log("elem state:" + element.ws.readyState);
        if(element.ws.readyState ==1){
          element.ws.send(obj);
        }/*else if(element.ws.readyState ==3){ // if it is closed then delete
          clientMap.splice(index, 1);
        }*/
      }
    });
    let timeStr = time.getHours() + ":" + time.getMinutes();
    var obj = JSON.stringify( {time:timeStr, your:true, ip:ip, message:escMessage} );
    if(ws.readyState ==1){
          ws.send(obj);
        }
    
  });
});



//interval for testing
(function() {
  var c = 0;
  var timeout = setInterval(function() {
    //donce every 4 intervals show client number, 4sec
    if(c%2==0){
      console.log("Clients: ws:[" + wss.clients.size + "] array:{"+clientMap.length+"}")
    }
    
    clientMap.forEach((element, index)=>{
        if(element.ws.readyState ==3){ // if it is closed then delete
          clientMap.splice(index, 1);
          console.log("delete socket: " + element.ip);
        }
    });
    

    //add counter
    c++;
    if (c > 900) {
      clearInterval(timeout);
      console.log("interval stopped")
    }
  }, 2000);
})();


//Add html site express serving
//=============================================================================
var express    = require('express');        // call express
var fs = require('fs');
var app        = express();


var port = process.env.PORT || 8008;        // set our port


// ROUTES FOR OUR API
// =============================================================================
app.get("/", function(req, res){
    console.log("home directory");
    fs.readFile('./public/index.html', function (err, html) {
        if (err) {
            throw err;
        }
        res.writeHeader(200, {"Content-Type": "text/html"});
        res.write(html);
        res.end();
    });
});


app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');
app.use(express.static('public')); // Allows for files in public to be accessible like so: "localhost:4000/login.html"

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Chat hosted on port ' + port);
console.log('Websocket port: ' + 8001);