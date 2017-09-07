var WebSocketServer = require("ws").Server;

//server as argument to run WebSocketServer on the same port
module.exports = function (server) {

var clientArr = new Array();
var msgHistorySize = 100;
var msgHistory = new Array();

console.log("starting WebSocket server...");
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
function allUsersJSON(_clientArr){ //get JSON string of all users
  let allUsersArr = { userList:[] };
  _clientArr.forEach((element, index)=>{
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
function addMsgHistory(msgObj){
  if(msgHistory.length < msgHistorySize){
    //just add at the end
    msgHistory.push(msgObj);
  }else{
    //delete first and push
    msgHistory.shift();
    msgHistory.push(msgObj);
  }
  console.log("msgHistory.length= " + msgHistory.length);
}
function sendMsgHistory(recipient){ //websocket as argument
  if(msgHistory.length > 0){
    msgHistory.forEach( (element, index)=>{
      let msgString = JSON.stringify(element);
      recipient.send(msgString);
    });
  }
}

wss.on("connection", (ws, req) => {
  let ip = req.connection.remoteAddress;
  let temp = clientArr.push( {ws:ws, ip:ip} );
  let client = clientArr[clientArr.length-1];
  console.log("clientArr.length= "+temp);
  sendMsgHistory(ws);
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
      let timeStr = time.getHours().toString() + ":" + time.getMinutes().toString();
      let obj = {time:timeStr, ip:ip, message:escMessage, your:false};
      addMsgHistory(obj);
      obj.color = (client.hasOwnProperty('color')) ? client.color : "blue";
      obj.name = (client.hasOwnProperty('name')) ? client.name : "Guest";
      obj.name = (obj.name=="") ? "Guest": obj.name;
      //send to all
      clientArr.forEach((element, index)=>{
         
          if(ws==element.ws){
            obj.your = true;
          }else{
            obj.your = false;
          }

          let objStr = JSON.stringify(obj);
          //console.log("elem state:" + element.ws.readyState);
          if(element.ws.readyState ==1){
            element.ws.send(objStr);
          }
      });
      obj.your = false; // because probably in msgHistory there is a non-deep clone
      //that means he still shares stuff with obj
    }
  });
});



//interval for testing
(function() {
  var c = 0;
  var timeout = setInterval(function() {
    //done every 4 intervals show client number, 4sec
    if(c%2==0){
      console.log("Clients: ws:[" + wss.clients.size + "] array:{"+clientArr.length+"}")
    }
    
    clientArr.forEach((element, index)=>{
        if(element.ws.readyState ==3){ // if it is closed then delete
          clientArr.splice(index, 1);
          console.log("delete socket: " + element.ip);
        }else{
          element.ws.send(allUsersJSON(clientArr));
        }
    });
    
    c++;
    // if (c > 900) {
    //   clearInterval(timeout);
    //   console.log("interval stopped")
    // }
  }, 2000);
})();




} //end of export