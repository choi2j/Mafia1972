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
let roomList = {};

//socket code
io.on("connection", (socket) => {
	console.log(`${socket.id} connected`);

	socket.emit('screen-init');
	socket.emit('server-sendRoomList', roomList);

	socket.on('makeNewRoom', (data) => {
		let target = data[0];
		let password = data[1];
		let ownerName = data[2];

		let room = roomList[target];

		if(room === undefined) {
			room = {
				"roomName": target,
				"ownerName": ownerName,
				"roomPassword": password,
				"player": {},
				"day": 0,
				"time": "Not Start Yet",
				"alivePeople": {
					"teamA": 0,
					"teamB": 0
				},
				"chats": [],
				"log": []
			};
			

			room.player[socket.id] = 
			{
				"id": socket.id,
				"nickname": ownerName,
				"alive": "wait", //"ALIVE / DEAD / observer",
				"job": undefined, //"mafia / police / doctor / citizen",
				"team": undefined, //"A / B"
			}
		
			roomList[target] = room;
			io.emit('server-sendRoomList', roomList);
			socket.join(target);
			socket.emit('server-sendJoinRoomOK', room);
			socket.emit('server-sendYouAreOwner');
		} else {
			socket.emit('server-sendMessage', '방 생성 실패 : 같은 이름의 방이 있음');
		}
		

		
	})

	socket.on('joinRoom', (data) => {
		let target = data[0];
		let password = data[1];
		let userName = data[2];

		let overlapCheck;

		let room = roomList[target];

		for (let i = 0; i < Object.keys(room.player).length; i++) {
			if (room.player[Object.keys(room.player)[i]].nickname === undefined) {
				continue;
			}
			if (room.player[Object.keys(room.player)[i]].nickname === userName) {
				overlapCheck = true;
			}
		}

		if (overlapCheck != true) {
			if (room.roomPassword === password && Object.keys(room.player).length < 10) {

				socket.join(target);

				room.player[socket.id] = 
				{
					"id": socket.id,
					"nickname": userName,
					"alive": 'observer', //true / false,
					"job": undefined, //"mafia / police / doctor / citizen",
					"team": undefined, //"A / B"
				}

				io.emit('server-sendRoomList', roomList);
				sendlog(target, 'room', null, `${userName}님이 접속했습니다.`);
				socket.emit('server-sendJoinRoomOK', room);
				
			} else {
				if(!(room.roomPassword === password)) {
					socket.emit('server-sendMessage', '방 접속 실패 : 비밀번호 불일치');
				}
				if(!(Object.keys(room.player).length < 10)) {
					socket.emit('server-sendMessage', '방 접속 실패 : 인원 제한');
				}
			}

			io.to(target).emit('server-sendUserUpdate', (room));
		} else {
			socket.emit('server-sendMessage', '방 접속 실패 : 닉네임 중복');
		}
	})

	socket.on('client-sendChatting', (data) => {
		let content = {id: data[1], content: data[2]}
		roomList[data[0]].chats.push(content);
		io.to(data[0]).emit('server-sendChatUpdate', content);
	})

	socket.on("disconnect", (reason) => {
		console.log(`${socket.id} disconnected`);
		for (let i = 0; i < Object.keys(roomList).length; i++) {
			for (let j = 0; j < Object.keys(roomList[Object.keys(roomList)[i]].player).length; j++) {
				if (socket.id == Object.keys(roomList[Object.keys(roomList)[i]].player)[j]) {
					sendlog(Object.keys(roomList)[i], 'room', null, `${roomList[Object.keys(roomList)[i]].player[socket.id].nickname}님의 접속이 끊겼습니다.(${reason})`);
					delete roomList[Object.keys(roomList)[i]].player[socket.id];

					io.emit("server-sendRoomList", roomList);
					io.to(Object.keys(roomList)[i]).emit('server-sendUserUpdate', roomList[Object.keys(roomList)[i]]);
					
				}
			}
		}
		
	});

	socket.on('gameStart', (target) => {
		let room = roomList[target];

		let userCount = 0;
		for (let i = 0; i < Object.keys(room.player).length; i++) {
			if (room.player[Object.keys(room.player)[i]].alive == 'wait') {
				userCount++;
			}
		}

		console.log(userCount);

		if (userCount < 4) {
			socket.emit('server-sendMessage', '게임 시작 실패 : 인원 부족');
			return;
		}

		for (let i = 0; i < Object.keys(room.player).length; i++) {
			if (room.player[Object.keys(room.player)[i]].alive == 'wait') {
				room.player[Object.keys(room.player)[i]].alive = 'ALIVE';
			}
		}
		io.to(target).emit('server-sendUserUpdate', room);
		
		let temp = Object.keys(room.player);
		let userList = [];

		
		for (let i = 0; i < temp.length; i++) {
			if (room.player[temp[i]].alive == 'ALIVE') {
				userList.push(temp[i]);
			}
		}
		

		switch (userList.length) {
			case 4:
				jobSetting(target, userList, 1, 0, 1, 2);
				break;
			case 5:
				jobSetting(target, userList, 1, 0, 1, 3);
				break;
			case 6:
				jobSetting(target, userList, 1, 1, 1, 3);
				break;
			case 7:
				jobSetting(target, userList, 2, 1, 1, 3);
				break;
			case 8:
				jobSetting(target, userList, 2, 1, 2, 3);
				break;
			case 9:
				jobSetting(target, userList, 3, 1, 2, 3);
				break;
			case 10:
				jobSetting(target, userList, 3, 1, 2, 4);
				break;
		}

		for (let i = 0; i < userList.length; i++) {
			if (room.player[userList[i]].team == 'A') {
				room.alivePeople.teamA++;
			} else if (room.player[userList[i]].team == 'B') {
				room.alivePeople.teamB++;
			}
		}


		room.time = 'day';
		console.log('ok');

		io.to(room.roomName).emit('server-sendGameUpdate', room);
	})

	socket.on('gameParticipate', (data) => {
		let target = data[0];
		let userName = data[1];

		let room = roomList[target];

		room.player[userName].alive = 'wait';

		io.to(target).emit('server-sendGameUpdate', room);
	})


});

//server code
server.listen(PORT, () => {
	console.log(`server is running ${PORT}`);
});

//function

/**
 * 서버 로그 보내는 함수
 * @param {string} room 보낼 방 이름
 * @param {string} targetType 보낼 범위 ('room' / 'team' / 'person')
 * @param {string} target 보낼 대상 (targettype = 'room'인 경우 null)
 * @param {string} content 보낼 내용
 */
function sendlog(room, targetType, target, content) {
	if(targetType == 'room') {
		io.to(room).emit('server-sendLog', content);
	} else if(targetType == 'team') {
		//WIP
	} else if(targetType == 'person') {
		io.to(target).emit('server-sendLog', content);
	}
	
	roomList[room].log.push(content);
}

/**
 * 직업 정해주는 함수
 * @param {String} roomName 직업 설정할 방 이름
 * @param {Array} users 직업 설정할 사람 리스트 = 참가 인원
 * @param {Number} mafia 마피아 수
 * @param {Number} police 경찰 수
 * @param {Number} doctor 의사 수
 * @param {Number} citizen 시민 수
 */
function jobSetting(roomName, users, mafia, police, doctor, citizen) {
	console.log(users);
	let room = roomList[roomName];
	
	for (let j = 0; j < mafia; j++) {
		let num = rand(0, users.length - 1);
		console.log(users);
		console.log([num, users[num]]);
		room.player[users[num]].job = 'mafia';
		room.player[users[num]].team = 'B';
		sendlog(roomName, 'person', users[num], `당신은 마피아입니다.`);
		sendlog(roomName, 'person', users[num], `매일 밤 사람 한 명을 죽일 수 있습니다.`);
		users.splice(num, 1);
	}
	for (let j = 0; j < police; j++) {
		let num = rand(0, users.length - 1);
		console.log(users);
		console.log([num, users[num]]);
		room.player[users[num]].job = 'police';
		room.player[users[num]].team = 'A';
		sendlog(roomName, 'person', users[num], `당신은 경찰입니다.`);
		sendlog(roomName, 'person', users[num], `매일 밤 사람 한 명이 마피아인지 아닌지 알 수 있습니다.`);
		users.splice(num, 1);
	}
	for (let j = 0; j < doctor; j++) {
		let num = rand(0, users.length - 1);
		console.log(users);
		console.log([num, users[num]]);
		room.player[users[num]].job = 'doctor';
		room.player[users[num]].team = 'A';
		sendlog(roomName, 'person', users[num], `당신은 의사입니다.`);
		sendlog(roomName, 'person', users[num], `매일 밤 사람 한 명을 치료할 수 있습니다.`);
		users.splice(num, 1);
	}
	for (let j = 0; j < citizen; j++) {
		let num = rand(0, users.length - 1);
		console.log(users);
		console.log([num, users[num]]);
		room.player[users[num]].job = 'citizen';
		room.player[users[num]].team = 'A';
		sendlog(roomName, 'person', users[num], `당신은 시민입니다.`);
		sendlog(roomName, 'person', users[num], `마피아를 색출해 살아남으십시오. 행운을 빕니다.`);
		users.splice(num, 1);
	}
	
	console.log(room);
}

function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

//이것은 아무 의미없는 주석