//server setting
const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);
app.use(express.static(path.join(__dirname, "src")));
const PORT = process.env.PORT || 5000;
const fs = require('fs');


//game variable
let roomList = [];

//socket code
io.on("connection", (socket) => {
	console.log(`${socket.id} connected`);
	socket.emit('server-sendRoomList', roomList);

	socket.on('makeNewRoom', (data) => {
		let roomName = data[0];
		let password = data[1];
		let ownerName = data[2];

		roomList.push(
			{
				"roomName": roomName,
				"ownerName": ownerName,
				"roomPassword": password,
				"player": [
					{
						"id": socket.id,
						"nickname": ownerName,
						"alive": undefined, //true / false,
						"job": undefined, //"mafia / police / doctor / citizen",
						"team": undefined, //"A / B"
					},
				],
				"day": 0,
				"time": "night",
				"alivePeople": {
					"teamA": 0,
					"teamB": 0
				},
				"chats": [],
				"log": []
			}
		)
		console.log(roomList);

		io.emit('server-sendRoomList', roomList);
	})

	socket.on('joinRoom', (data) => {
		let target = data[0];
		let password = data[1];
		let userName = data[2];
	})

	socket.on("disconnect", () => {
		console.log(`${socket.id} disconnected`);
	});
});

//server code
server.listen(PORT, () => {
	console.log(`server is running ${PORT}`);
});

//function
