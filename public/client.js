// by kent wong 00318833 tutorial b05
let username;
let localcolor;

var correctts;
  // scroller
  function scrollToBottom(id){
    var div = document.getElementById(id);
    div.scrollTop = div.scrollHeight - div.clientHeight;
 }

  // Prevents input from having injected markup; TODO - implement this
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // to convert a ts obj to a nice casual time zone
  function tsconvert(ts) {
    formatted_ts = ts.
    replace(/T/, ' ').  // nuke the T
    replace(/\..+/, '') // nuke Time Zone info

    return formatted_ts
  }

  // Log a message
  // TODO
  const log = (message, options) => {

    // remove this and actually properly implement
    var $el = $('<li>').addClass('log').text(message);
  }

  // clean up participant and fix/retool for new user has entered
  const addParticipantsMessage = (data) => {

  }

  const genericMessageHandler = (data) => {
    //console.log("Debug: USing generic msg handler.")

    let message = '';


  }


// when a client loads
/*
Assign a name; check for cookie (assign appropriate name)
Give chat history to the user

Client: Get a name, emit name to server
Server: Add name to pool

should avoid monolithic blocks, keep it modular
problem is the emit back+forth pings


*/


// start doc and listen
$(document).ready(onLoad());

function onLoad() {
    console.log("initating client.js");
    

    /* 
    flow

    event send receive
    on  user connection detected
    mirror / / user connection detected
      need to decide on cookie name or new name
    
    */


    //init variables
    let socket = io();
    
    // catch user connections
    socket.on('user-connection-detected', function(username){

      // if cookie exists, populate name from cookie
      if(document.cookie){
        console.log('cookie logic');
        socket.emit('new cookie', document.cookie);
        $('#yourname').text("* You are " + document.cookie);
        $('#userpool').append($('<li>').text(document.cookie));
        username = document.cookie;
        console.log('value of cookie enabled username is now:' + username);
        socket.emit('add user', username);
        socket.emit('upkeep pool');
      // otherwise we need to add this user
      }else{
        console.log('non cookie logic');
        // need to add user then
        let tmpname = 'ASSIGNME';
        socket.emit('add user',tmpname);
        socket.emit('upkeep pool');
      }
    });

    //catch generic username assignment
    socket.on('name-assigned', function(customusername){
      console.log("name assignment executed")
      username = customusername;
      console.log('value of username is now:' + username);
    });
    


    //catch username change
    socket.on('updated username', function(newusername){
      document.cookie = newusername
      $('#yourname').text("* You are " + username);
      username = newusername;
    });

    //catch a new user sign up cookie issue
    socket.on('add user cookie', function(username){
      document.cookie = username;
      $('#yourname').text("* You are " + username);
    })

    //catch disconnects
    socket.on('disconnected user occurred', function(temp){
      socket.emit("timestamp ping");
      socket.on("ts ping back", function(ts) {
        correctts = tsconvert(ts)
      });
      // for some reason this royally f'ed itself when it was on the inner socket catch.
      // would iteratively count up and do call backs for each counter
      // would be good to find out why later
      // my only guess is that a nested socket catch causes serious problems, should ask later
      $('#messages').append($('<li>').text(correctts + " : " + temp + " has left the room."));
      socket.emit("upkeep pool");
      
    });

    
    // send message
    $('form').submit(function(e){
        let val = $('#m').val();
        socket.emit('chat message', {
          message: val,
          author: username,
        });
        console.log('firing chat message send');
        $('#m').val(''); // blank out the form
        return false; // ret false
    });

    // socket on chat message listen, emit the message
    socket.on('chat message', function(msg){
        // sanitization occurs on server side
        sanitized_msg = msg.message;
        formatted_ts = msg.ts.
        replace(/T/, ' ').  // nuke the T
        replace(/\..+/, '') // nuke Time Zone info
        let author = msg.author
        loc_color = msg.color
        //DEBUG
        //console.log("core chat msg obj:"+msg.message + "the time stamp is:" + formatted_ts);
        //DEBUG
        //console.log('prior to appending messages, the username valueis: ' + username);
        $('#messages').append($('<li>').html(formatted_ts + 
          '<span style="color:#' + loc_color + '">' 
          +" " + author+ " : " + sanitized_msg));
        $(".chat-container").scrollTop($("#messages")[0].scrollHeight); // scroll to bottom
    });


    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function(data){
        // second mistake, casting this as a local seems to have caused
        // some serious issues
        // fixed by declaring as a global var. probably issues upon reconnection redeclaring it
        // caused it to be undefined
        // find out reason later, but this is fixed
        //let correctts; // casting this to empty string initially somehow royally fucked me
        //console.log('firing user joined alert');
        socket.emit("timestamp ping");
        socket.on("ts ping back", function(ts) {
          //console.log('formatting ts');
          correctts = tsconvert(ts);
          //console.log('the correct tts after defining is :' + correctts);
        });
        //console.log('the correct tts is :' + correctts);
        let message = ''; // blank
        message = "there are " + data.numUsers + " participants";
        //console.log('the correct tts value prior to appending is :' + correctts);
        $('#messages').append($('<li>').text(String(correctts) + ": " + String(message)));
    });

    // user pool update on the right side 
    socket.on('updated userpool', function (userpool) {
        //console.log("entering userpol update func")
        $('#userpool').text(" "); // blank out pool
        for (let i = 0; i < userpool.length; i++) {
            $('#userpool').append($('<li>').html('<span style="color:#' + userpool[i].color + '">'
            + userpool[i].username + '</span>'));
        }
    });

    socket.on('color-set', function (color) {
      localcolor = color;

  });

}