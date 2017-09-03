var express    = require('express');        // call express
var fs = require('fs');
var app        = express();
var pug = require('pug');

var port = process.env.PORT || 8080;        // set our port


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

//Websocket stuff -->
var WebSocketServer = require("ws").Server;
var clientMap = new Array();
// wss.on('connection', function(ws, req) {
//   console.log(req.connection.remoteAddress);
// });

console.log("starting...");
var wss = new WebSocketServer({ server : server });

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
function allUsersJSON(_clientMap){ //get JSON string of all users
  let allUsersArr = { userList:[] };
  _clientMap.forEach((element, index)=>{
    let name = (element.hasOwnProperty('name')) ? element.name : "Guest";
    name = (name=="") ? "Guest": name;
    let color = (element.hasOwnProperty('color')) ? element.color : "blue";
    let userObj = {
      name:name,
      color:color
    }
    allUsersArr.userList.push(userObj);
  });
  return JSON.stringify(allUsersArr);
}

wss.on("connection", (ws, req) => {
  let ip = req.connection.remoteAddress;
  let temp = clientMap.push( {ws:ws, ip:ip} );
  let client = clientMap[clientMap.length-1];
  console.log("length "+temp)

  ws.on('message', (message) =>{
    console.log('received: %s', message);
    let msgObj = (JSON.parse(message));

    //used in message to add custom name/color

    if(msgObj.hasOwnProperty('name')){
      client.name = escapeHtml(msgObj.name);
      console.log("new color "+client.name );
    }
    if(msgObj.hasOwnProperty('color')){
      client.color = escapeHtml(msgObj.color);
      console.log("new color "+client.color );
    }

    if(msgObj.hasOwnProperty('message')){
      let time = new Date();
      //send to everybody
      let escMessage = escapeHtml(msgObj.message);

      //send to all
      clientMap.forEach((element, index)=>{
          let timeStr = time.getHours().toString() + ":" + time.getMinutes().toString();
          let obj = {time:timeStr, ip:ip, message:escMessage};
          obj.color = (client.hasOwnProperty('color')) ? client.color : "blue";
          obj.name = (client.hasOwnProperty('name')) ? client.name : "Guest";
          obj.name = (obj.name=="") ? "Guest": obj.name;
          if(ws==element.ws){
            obj.your = true;
          }else{
            obj.your = false;
          }

          let objStr = JSON.stringify(obj);
          console.log("elem state:" + element.ws.readyState);
          if(element.ws.readyState ==1){
            element.ws.send(objStr);
          }
      });
    }
  });
});



//interval for testing
(function() {
  var c = 0;
  var timeout = setInterval(function() {
    //done every 4 intervals show client number, 4sec
    if(c%2==0){
      console.log("Clients: ws:[" + wss.clients.size + "] array:{"+clientMap.length+"}")
    }
    
    clientMap.forEach((element, index)=>{
        if(element.ws.readyState ==3){ // if it is closed then delete
          clientMap.splice(index, 1);
          console.log("delete socket: " + element.ip);
        }else{
          element.ws.send(allUsersJSON(clientMap));
        }
    });
    
    c++;
    // if (c > 900) {
    //   clearInterval(timeout);
    //   console.log("interval stopped")
    // }
  }, 2000);
})();


console.log('Html and Websocket hosted on port ' + port);