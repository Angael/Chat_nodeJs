var WebSocketServer = require("ws").Server;
var clientMap = new Array();
// wss.on('connection', function(ws, req) {
//   console.log(req.connection.remoteAddress);
// });

console.log("starting...");
var wss = new WebSocketServer({
  port:8080
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
  let client = clientMap[clientMap.length-1];
  console.log("length "+temp)

  //testloop
  clientMap.forEach((element, index)=>{
    console.log(index+"# "+element.ip);
    }
  );
  //testloop

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
        //if (element.ws !== ws){
        //}
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
          }/*else if(element.ws.readyState ==3){ // if it is closed then delete
            clientMap.splice(index, 1);
          }*/
        
      });
      //send to author of message
      // let timeStr = time.getHours() + ":" + time.getMinutes();

      // let objStr = JSON.stringify( {time:timeStr, your:true, ip:ip, message:escMessage} );
      // if(ws.readyState ==1){
      //   ws.send(objStr);
      // }
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
          //send all users list of all connected users
          element.ws.send(allUsersJSON(clientMap));
        }
    });
    

    //add counter
    c++;
    // if (c > 900) {
    //   clearInterval(timeout);
    //   console.log("interval stopped")
    // }
  }, 2000);
})();
// START THE SERVER
// =============================================================================

console.log('Websocket port: ' + 8080);