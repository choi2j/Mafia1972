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
let username = [];

//socket code
io.on("connection", (socket) => {
	console.log(`${socket.id} connected`);

	socket.on("disconnect", () => {
		console.log(`${socket.id} disconnected`);
	});
});

//server code
server.listen(PORT, () => {
	console.log(`server is running ${PORT}`);
});

//function
