$(document).ready(function() {

var connection;
var areSettingsSet = false;
var settings = settings = {
                name:"Guest",
                color:"blue"
            };
var userList = [];
var isConnected = false;
var connectTimeout;
var address = "89.78.164.45:8001";

function sendMessage(){
    let messageObj = {
            message:$('#chatInput').val()
        }
        connection.send( JSON.stringify(messageObj) );
        $('#chatInput').val("");
}
$("#chatInput").keypress(function(e) { //check for enter press in chat input
    if(e.which == 13) {
        sendMessage();
    }
});
function connect(){
    //if not connected, create websocket and events
    //else just update settings
    if(!isConnected){
        //connection.close();
        connection = new WebSocket('ws://'+address);
        console.log("connecting...");
        
        connection.onerror = (event) => {
            if(!isConnected){
                return;
            }
            isConnected = false;
            // $('#connectionState').html("disconnected<br>Error").removeClass( "connected" );
            $('.statusErr .tooltipStatus').html("Server/Client Error");
            $('.statusErr').show();
            $('.statusOk').hide();
            console.log("Error with websocket connection");
            connection.close();
            connectTimeout = setTimeout(connect, 2000);
        }
        connection.onopen = (event) => {
            if(!areSettingsSet){
                areSettingsSet = true;
                connection.send( JSON.stringify(settings) );
            }
            $('.statusErr .tooltipStatus').html("No Error");
            $('.statusErr').hide();
            $('.statusOk').show();
            isConnected = true;
        }
        connection.onclose = (event) => {
            if(!isConnected){
                return;
            }
            isConnected = false;
            $('.statusErr .tooltipStatus').html("Server was closed");
            $('.statusErr').show();
            $('.statusOk').hide();
            connection.close();
            connectTimeout = setTimeout(connect, 2000);
        }
        connection.onmessage = (event) => {
            let obj = JSON.parse(event.data);
            if(obj.hasOwnProperty("message")){
                newMessage(event.data);
                $(".chatHistory").animate({ scrollTop: $(".chatHistory")[0].scrollHeight }, 5);
            }
            if(obj.hasOwnProperty("userList")){
                userList = obj.userList;
            }
        };
    }else{
        //update settings, because we are connected
        areSettingsSet = true;
        connection.send( JSON.stringify(settings) );
    }
}
// var buttonConnect = ()=>{
//     console.log("manual connect");
//     connection = new WebSocket('ws://192.168.0.66:8001');
// }
var newMessage = (objStr) => {
    let obj = JSON.parse(objStr);
    let your = obj.your ? "your" : "notYour";
    let message = 
    `<div class="message">
        <div class="bubble ${obj.color} ${your}">
            ${obj.message} 
            <div class="author">
                ${obj.name}
            </div>
            <span class="tooltip">${obj.ip}<br>[${obj.time}]</span>
        </div>
    </div>`;
    $(".chatHistory").append(message);
}

$(".statusErr").click( (event)=>{
    connect();
    console.log("Manual Reconnect...");
} );

$(window).click(function(event) {
    if( event.target == $("#grayedOutBackground").get()[0] ){ //convert dom obj to jquery obj
        $("#grayedOutBackground").hide();
        $("#userListWindow").hide();
        $("#settingsWindow").hide();
    }
});
$(".sendMessage").click((event)=>{
    sendMessage();
});
$(".connectSettings").parent().click((event)=>{
    $("#settingsWindow").show();
    $("#grayedOutBackground").show();
    
});
$("#userListWindow").hide();
$(".userList").parent().click(()=>{
    $("#userListWindow").show();
    $("#grayedOutBackground").show();
    //put all users in there;
    $("#userListWindow").html("");
    if(userList.length == 0){
        $("#userListWindow").html("<h2>Not connected</h2>");
    }else{
        userList.forEach( (element, index)=>{
            let userInfo = `
            <div class="user ${element.color}">
                ${element.name}
            </div>
            `;
            $("#userListWindow").append(userInfo);
        });
    }
});
(()=>{
    //let promptStr = prompt("Enter address of chat or enter nothing to connect to pi@"+address, "192.168.0.66:8001")
    //if(promptStr && promptStr.trim()) {// check if anything is written in addrees
    //    
    //    address = promptStr;
    //}
    $("#settingsConnect").click( ()=>{
        $("#grayedOutBackground").hide();
        $("#settingsWindow").hide();
        if($("#ipAddress").val() ){
            address = $("#ipAddress").val();
        }else{
            address = "192.168.0.66:8001";
        }
        settings = {
            name:$("#nameInput").val(),
            color:$('input[name=color]:checked', '#settings').val()
        }
        
        connect();
    });

    //Set default value for connection to this page url minus http
    let url = window.location.href;
    let wsUrlStr = url.substring(url.indexOf("://") + 3);
    $("#ipAddress").val(wsUrlStr);

})();

});