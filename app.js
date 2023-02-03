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
				"partyciPlayer": [],
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
				"gainedBallot": 0, //0
				"action": null
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
					"gainedBallot": 0, //0
					"action": null
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

			io.to(target).emit('server-sendGameUpdate', (room));
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
					io.to(Object.keys(roomList)[i]).emit('server-sendGameUpdate', roomList[Object.keys(roomList)[i]]);
					
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

		if (userCount < 4) {
			socket.emit('server-sendMessage', '게임 시작 실패 : 인원 부족');
			return;
		}
		for (let i = 0; i < Object.keys(room.player).length; i++) {
			if (room.player[Object.keys(room.player)[i]].alive == 'wait') {
				room.player[Object.keys(room.player)[i]].alive = 'ALIVE';
			}
		}
		io.to(target).emit('server-sendGameUpdate', room);
		let temp = Object.keys(room.player);
		let userList = [];

		for (let i = 0; i < temp.length; i++) {
			if (room.player[temp[i]].alive == 'ALIVE') {
				userList.push(temp[i]);
			}
		}

		switch (userList.length) {
			case 4:
				jobSetting(target, userList, 1, 1, 0, 2);
				break;
			case 5:
				jobSetting(target, userList, 1, 1, 0, 3);
				break;
			case 6:
				jobSetting(target, userList, 1, 1, 1, 3);
				break;
			case 7:
				jobSetting(target, userList, 2, 1, 1, 3);
				break;
			case 8:
				jobSetting(target, userList, 2, 2, 1, 3);
				break;
			case 9:
				jobSetting(target, userList, 3, 2, 1, 3);
				break;
			case 10:
				jobSetting(target, userList, 3, 2, 1, 4);
				break;
		}

		for (let i = 0; i < temp.length; i++) {
			if (room.player[temp[i]].alive == 'ALIVE') {
				room.partyciPlayer.push(temp[i]);
			}
		}

		for (let i = 0; i < room.partyciPlayer.length; i++) {
			if (room.player[room.partyciPlayer[i]].team == 'A') {
				room.alivePeople.teamA++;
			} else if (room.player[room.partyciPlayer[i]].team == 'B') {
				room.alivePeople.teamB++;
			}
		}

		

		room.time = 'day';
		io.to(room.roomName).emit('server-sendGameUpdate', room);
		
		dayFunc(room);
	})

	socket.on('gameParticipate', (data) => {
		let target = data[0];
		let userName = data[1];

		let room = roomList[target];

		room.player[userName].alive = 'wait';

		io.to(target).emit('server-sendGameUpdate', room);
	})

	socket.on('client-sendVote', (data) => {
		let room = roomList[data[0]];
		let voted = data[1];
		let target = data[2];

		if(roomList[data[0]].player[voted] !== undefined) {
			room.player[voted].gainedBallot--;
		} else {
			
		}
		room.player[target].gainedBallot++;
	})

	socket.on('client-sendMafiaAction', (data) => { //WIP
		let roomName = data[0];
		let target = data[1];

		roomList[roomName].player[socket.id].action = target;
	});
	
	socket.on('client-sendPoliceAction', (data) => { //WIP
		let roomName = data[0];
		let target = data[1];

		roomList[roomName].player[socket.id].action = target;
	});

	socket.on('client-sendDoctorAction', (data) => { //WIP
		let roomName = data[0];
		let target = data[1];

		roomList[roomName].player[socket.id].action = target;
	});
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
	let room = roomList[roomName];
	
	for (let j = 0; j < mafia; j++) {
		let num = rand(0, users.length - 1);
		room.player[users[num]].job = 'mafia';
		room.player[users[num]].team = 'B';
		sendlog(roomName, 'person', users[num], `당신은 마피아입니다.`);
		sendlog(roomName, 'person', users[num], `매일 밤 사람 한 명을 죽일 수 있습니다.`);
		users.splice(num, 1);
	}
	for (let j = 0; j < police; j++) {
		let num = rand(0, users.length - 1);
		room.player[users[num]].job = 'police';
		room.player[users[num]].team = 'A';
		sendlog(roomName, 'person', users[num], `당신은 경찰입니다.`);
		sendlog(roomName, 'person', users[num], `매일 밤 사람 한 명이 마피아인지 아닌지 알 수 있습니다.`);
		users.splice(num, 1);
	}
	for (let j = 0; j < doctor; j++) {
		let num = rand(0, users.length - 1);
		room.player[users[num]].job = 'doctor';
		room.player[users[num]].team = 'A';
		sendlog(roomName, 'person', users[num], `당신은 의사입니다.`);
		sendlog(roomName, 'person', users[num], `매일 밤 사람 한 명을 치료할 수 있습니다.`);
		users.splice(num, 1);
	}
	for (let j = 0; j < citizen; j++) {
		let num = rand(0, users.length - 1);
		room.player[users[num]].job = 'citizen';
		room.player[users[num]].team = 'A';
		sendlog(roomName, 'person', users[num], `당신은 시민입니다.`);
		sendlog(roomName, 'person', users[num], `마피아를 색출해 살아남으십시오. 행운을 빕니다.`);
		users.splice(num, 1);
	}
	
}

function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function timer(time, target) {
	var left = time;

	let promise = new Promise((resolve, reject) => {
		var x = setInterval(function() {

			io.to(target).emit('server-sendTime', left);
			left--;
	
			//타임아웃 시
			if (left < 0) {
				clearInterval(x);
				resolve(1)
			}
		}, 1000);
	})

	return await promise;
}


//WIP

/**
 * 낮 함수
 * @param {Object} target 방 데이터
 */
async function dayFunc (target) {
	if(
		target.alivePeople.teamA > target.alivePeople.teamB &&
		target.alivePeople.teamB > 0
	) {
		
		io.to(target.roomName).emit('server-sendGameUpdate', target);
		io.to(target.roomName).emit('server-sendDay');
		sendlog(target.roomName, 'room', null, '낮이 되었습니다.');
		timer(20, target.roomName).then(function () {
			dayEndFunc(target)
		});
	} else {
		gameEnd(target);
	}
}

//done.
/**
 * 낮 끝날때 쓰는 함수
 * @param {Object} target 방 데이터
 */
async function dayEndFunc(target) {
	if(
		target.alivePeople.teamA > target.alivePeople.teamB &&
		target.alivePeople.teamB > 0
	) {
		io.to(target.roomName).emit('server-sendGameUpdate', target);

		var inner = async function () {
			let deadVoted = 0;
			let temp1 = [];
			let Participate = target.partyciPlayer;
			target.time = 'night';
			for (let i = 0; i < Participate.length; i++) {
				if (deadVoted < target.player[Participate[i]].gainedBallot) {
					deadVoted = target.player[Participate[i]].gainedBallot;
				}
			}

			for(let i = 0; i < Participate.length; i++) {
				if(target.player[Participate[i]].gainedBallot == deadVoted) {
					temp1.push(target.player[Participate[i]].id);
				}
				sendlog(target.roomName, 'room', null, `${target.player[Participate[i]].nickname}의 득표수 : ${target.player[Participate[i]].gainedBallot}`);
			}
			if (temp1.length > 1) {
				sendlog(target.roomName, 'room', null, '아무도 죽지 않았습니다 : 득표수 같음');
			} else {
				sendlog(target.roomName, 'room', null, `${target.player[temp1[0]].nickname}이 투표로 죽었습니다.`);
				if (target.player[temp1[0]].team == 'A') {
					sendlog(target.roomName, 'room', null, `${target.player[temp1[0]].nickname}은 마피아가 아니었습니다.`);
					target.alivePeople.teamA--;
				} else if (target.player[temp1[0]].team == 'B') {
					sendlog(target.roomName, 'room', null, `${target.player[temp1[0]].nickname}은 마피아였습니다.`);
					target.alivePeople.teamB--;
				}
				target.player[temp1[0]].alive = 'DEAD';
			}
		}
		inner().then(function () {
			nightFunc(target)
		});
	} else {
		gameEnd(target);
	}
}

/**
 * 밤 함수
 * @param {Object} target 방 데이터
 */
async function nightFunc(target) {
	if(
		target.alivePeople.teamA > target.alivePeople.teamB &&
		target.alivePeople.teamB > 0
	) {
		sendlog(target.roomName, 'room', null, '밤이 되었습니다.');
		io.to(target.roomName).emit('server-sendGameUpdate', target);
		io.to(target.roomName).emit('server-sendNight');
		timer(120, target.roomName).then(function () {
			nightEndFunc(target)
		});
	} else {
		gameEnd(target);
	}
}

/**
 * 밤 끝날때 쓰는 함수
 * @param {Object} target 방 데이터
 */
async function nightEndFunc(target) {
	if(
		target.alivePeople.teamA > target.alivePeople.teamB &&
		target.alivePeople.teamB > 0
	) {
		var inner = async function () {
			io.to(target.roomName).emit('server-sendGameUpdate', target);
		}
		inner().then(function () {
			dayFunc(target)
		} );
	} else {
		gameEnd(target);
	}
}

/**
 * 게임 끝나면 쓰는 함수
 * @param {Object} target 방 데이터
 */
function gameEnd(target) {

	if (target.alivePeople.teamB <= 0) {
		sendlog(target.roomName, 'room', null, '시민 승리 : 모든 마피아가 죽었습니다.');
	} else if (target.alivePeople.teamA <= target.alivePeople.teamB) {
		sendlog(target.roomName, 'room', null, '마피아 승리 : 시민의 수와 마피아의 수가 같아졌습니다.');
	}
	for (let i = 0; i < target.partyciPlayer.length; i++) {
		target.player[target.partyciPlayer[i]].alive = 'observer';
	}
	io.to(target.roomName).emit('server-sendGameUpdate', target);
	io.to(target.roomName).emit('server-sendGameEnd', target);
	console.log('My Work Is Done.');
}
//이것은 아무 의미없는 주석