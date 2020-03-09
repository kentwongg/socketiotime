// by kent wong 00318833 tutorial b05
const express = require('express');
const app = express();  //init app to be a func handler, we can supply this to a http server
const port = 3000

var http = require('http').createServer(app); // supply app to a http server 
var io = require('socket.io')(http); // add socket.io object
app.use(express.static(__dirname + '/public')); // set routing for express js

var numUsers = 0;
var userpool = [];


  // time stamp helper method
  // deprecated
  function getthetime(){
    datetimeobj = new Date().toISOString
    return datetimeobj;
  }
  // color validator
  const isColor = (intColor) => {

	boolpass = false;

	if (isNaN(intColor)) {
		boolpass = false;
		return boolpass
	};

	if (intColor.toString().length < 10 && intColor.toString().length > 2 ) {
		boolpass = true
	}
	return boolpass
  }

  // to spot check var values
  function debughelp(){
	  //console.log("debug helper method fired.");
	  //console.log(userpool)
  }

  // rng jesus colors
function getRandomColor() {
	var letters = '012345678ABCDEF';
	var color = '';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 8)];
	}
	return color;
}

function checkDuplicate(name) {
	let tmp = name
	for (let count = 0; count < userpool.length; count++) {
		//console.log("searching for:");
		//console.log(socket.username);
		//console.log("against: " + userpool[1].username);
		//console.log("bool: "+socket.username === userpool[1].username)
		//console.log(userpool[count].username)
		//console.log("socketname is:"+ socket.username)
		// HOLY SOCKET.NAME DOES NOT EXIST OMGGGGGG TILTED
		if (String(userpool[count].username) === String(tmp)){
			tmp = 'chatUser' + String(parseInt((Math.random() * 100) +1));
			//console.log("sucessful user deletion");
		}
	}
	return tmp;
};

function setName(oldusername, newname) {
	// go through and set existing old name to new name
	for (let count = 0; count < userpool.length; count++) {
		if (String(userpool[count].username) === String(oldusername)){
			userpool[count].username = newname;
			return true;
		}
	}
	return false;
}

function userRemoval(username) {
	for (let count = 0; count < userpool.length; count++) {
		//console.log("searching for:");
		//console.log(socket.username);
		//console.log("against: " + userpool[1].username);
		//console.log("bool: "+socket.username === userpool[1].username)
		//console.log(userpool[count].username)
		//console.log("socketname is:"+ socket.username)
		// HOLY SOCKET.NAME DOES NOT EXIST OMGGGGGG TILTED
		if (String(userpool[count].username) === String(socket.username)){
			userpool.splice(count,1);
			//console.log("sucessful user deletion");
		}
	}
}


// use socket.io obj and listen on connection events for an inc socket param
io.on('connection', function(socket){

	let color = getRandomColor();
	//console.log('a user connected'); // show status for connectors
	socket.emit('user-connection-detected');

	// generic time ping
	socket.on('timestamp ping', function() {
		//console.log('time stamp ping caught');
		tsobj = new Date();
		io.emit('ts ping back', tsobj);

	});

	// socket.on('add user', function(msg){
	// 	//console.log('User has entered: ' + msg);
	// 	debughelp();
	//   });

	
	// chat messages 
	// includes use of time stamp func
	socket.on('chat message', function(msg){
		//console.log('catching a chat message send');
		//console.log(msg);
		let tsobj = new Date();
		let boolsetname = false;
		console.log('test for msg.message:');
		console.log(msg.message);
		if(msg.message.startsWith("/nick ")) {
			let oldalias = msg.author;
			let potential = msg.message.slice(6); // because /nick is 5
			let dupecheck = false;
			result = checkDuplicate(potential)

			if (potential === result) {
				dupecheck = false;
			} else {
				dupecheck = true;
			}

			if (dupecheck === true) {
				msg.message = 'Alert: NAME CHANGE FAILED!'
			} else if (dupecheck === false) {
				console.log('firing setname invoc');
				boolsetname = setName(oldalias, potential);
				if (boolsetname === true) {
					io.emit('updated userpool', userpool);
					io.emit('updated username', potential);
					msg.message = oldalias + " has changed their username to: " + potential
					msg.author = potential
					socket.username = potential;
				}
			}
		}

		if(msg.message.startsWith("/nickcolor ")){
			console.log('nothing')
			socket.color = msg.message.slice(11);  // /nickcolor is 11
			let colorguardbool = false;

			colorguardbool = isColor((socket.color))
			console.log("colorguardbool is: "+ colorguardbool);
			let changecolorbool = false; 
			if (colorguardbool === true) {
				for(let i = 0; i < userpool.length; i++) {
					if(userpool[i].username === socket.username) {
						userpool[i].color = socket.color;
						console.log("color changed")
						changecolorbool = true;
					}
				}
				if (changecolorbool === true) {
					console.log("sucessful user color change")
					socket.emit('color-set', socket.color);
					io.emit('updated userpool', userpool);
					msg.message = socket.username + " has changed their color to: " + socket.color
				}
			} else if (colorguardbool === false) {
				msg.message = "Alert: That's an INVALID COLOR."
			}
		}

		// remove tags from the message
		let regex = /<[^>]*>/g;
		if (regex.test(msg.message)) {
			console.log("tags detected and removed");
			msg.message = msg.message.replace(regex, "");
		}

		msg.message = msg.message.replace("/", "");
		// finally emit
		io.emit('chat message', {
			message: msg.message,
			ts: tsobj,
			author: msg.author,
			color: socket.color,
		});
	  });


	// when the client emits 'add user', this listens and executes
	socket.on('add user', (username) => {
		++numUsers;
		console.log("init username is:"+ username)
		socket.color = color;
		if (username === 'ASSIGNME' || username === null) {
			// we store the username in the socket session for this client
			socket.username = "chatUser"+numUsers;
			socket.username = checkDuplicate(socket.username);
			socket.emit('name-assigned', socket.username);
			socket.emit('new user cookie', socket.username);
			//console.log("socketname is:"+ socket.username);
		} else if (username != 'ASSIGNME'){
			console.log("successfully grabbed custom name and assigned it")
			username = checkDuplicate(username);
			socket.username = username;
			console.log("cookie name test:"+ socket.username);
			socket.emit('name-assigned', socket.username);
			//console.log("socketname is:"+ socket.username);
		}


		// if (username != 'ASSIGNME'){
		// 	console.log("successfully grabbed custom name and assigned it")
		// 	username = checkDuplicate(username);
		// 	socket.username = username;
		// 	console.log("cookie name test:"+ socket.username);
		// 	socket.emit('name-assigned', socket.username);
		// 	//console.log("socketname is:"+ socket.username);
		// } else if (username === 'ASSIGNME' || username === null) {
		// 	// we store the username in the socket session for this client
		// 	socket.username = "chatUser"+numUsers;
		// 	socket.username = checkDuplicate(socket.username);
		// 	socket.emit('name-assigned', socket.username);
		// 	socket.emit('new user cookie', socket.username);
		// 	//console.log("socketname is:"+ socket.username);
		// }

		//debug
		//console.log("debug: counter of user is :" + numUsers)
		//console.log("debug: username assigned is :" + socket.username)
		// end debug

		//update server userpool
		userpool.push({username:socket.username, color: color});
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers,
		}); 
		//console.log("Debug: broadcasted users success " + socket.username);
		socket.emit('add user cookie', socket.username)
		//console.log(userpool);

	});

	socket.on('upkeep pool', function() {
		io.emit('updated userpool', userpool);
	})

	// handle user disconnects
	socket.on('disconnect', function(){
		--numUsers;
		//console.log('user disconnected'); // show status for disconnectors
		let temp = socket.username;
		socket.broadcast.emit('disconnected user occurred', temp);
		for (let count = 0; count < userpool.length; count++) {
			//console.log("searching for:");
			//console.log(socket.username);
			//console.log("against: " + userpool[1].username);
			//console.log("bool: "+socket.username === userpool[1].username)
			//console.log(userpool[count].username)
			//console.log("socketname is:"+ socket.username)
			// HOLY SOCKET.NAME DOES NOT EXIST OMGGGGGG TILTED
			if (String(userpool[count].username) === String(socket.username)){
				userpool.splice(count,1);
				//console.log("sucessful user deletion");
			}
		}
		});
  });


// listener 
http.listen(port, function(){ // tell the server 'http' to listen on port 3000
	  console.log('listening on *:3000');
});
