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

// //SQL setting
// const mysql = require('mysql');

// var SQLconnection = mysql.createConnection({
//     host: '127.0.0.1',
//     port: '3306',
//     user: 'serverUser',
//     password: 'serverpassword'
// })

// SQLconnection.connect(function(err) {
//     if(err) {
//         console.error('error: ' + err.stack);
//         return
//     }

//     console.log('connected as id ' + SQLconnection.threadId);
// })

//game variable
let roomList = [
	{ roomName: "asdf", roomOwner: "scvif", roomPeople: ["scvif"], roomPassword: "1234" },
	{ roomName: "qwer", roomOwner: "choi2j", roomPeople: ["choi2j"], roomPassword: "1234" }, //테스트용
];
let username = [
	{ username: "scvif", id: "someidlen20aaaaaaaaa" },
	{ username: "scvif", id: "someidlen20bbbbbbbbb" },
];

//socket code
io.on("connection", (socket) => {
	console.log(`${socket.id} connected`);

	socket.emit("session", {
		id: socket.id,
		handshake: socket.handshake,
	});

	socket.on("reqRoomList", () => {
		socket.emit("resRoomList", roomList);
	});

	socket.on("roomChoice", (roomName) => {
		socket.join(roomName);
		console.log(socket.rooms);
		socket.emit("connectRoom", roomName);
	});

	socket.on("disconnect", () => {
		console.log(`${socket.id} disconnected`);
	});
});

//server code
server.listen(PORT, () => {
	console.log(`server is running ${PORT}`);

	app.post("/roomCreate", (req, res) => {
		roomList.push({
			roomName: req.body.roomName,
			roomOwner: req.body.roomOwner,
			roomPeople: [req.body.roomOwner],
			roomPassword: req.body.roomPassword,
		});
		console.log(roomList);
		res.sendFile(__dirname + "/html/room.html?ownerName=" + req.body.roomOwner);
	});
});

app.get("/list", (req, res) => {
    res.sendFile(__dirname + "/html/list.html")
});

//function
