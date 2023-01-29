const socket = io();

let currentRoom;
let currentUserName;
let isOwner;
let roomData;
let currentVoted;

socket.on("screen-init", () => {
	screenChange("mkroom", "room");
});

socket.on("server-sendRoomList", (data) => {
	console.log(data);
	console.log(Object.keys(data).length);
	document.getElementsByClassName("room-list")[0].innerHTML = "";

	let li, Name, Owner, People;
	let key;
	for (let i = 0; i < Object.keys(data).length; i++) {
		key = Object.keys(data)[i];

		console.log("data[key]: ", data[key]);

		li = document.createElement("li");
		li.className = "room-item";

		Name = document.createElement("p");
		Name.className = "text-big room-name";
		Name.innerHTML = data[key].roomName;

		Owner = document.createElement("p");
		Owner.className = "text-small room-owner";
		Owner.innerHTML = data[key].ownerName;

		People = document.createElement("p");
		People.className = "text-small room-cap";
		People.innerHTML = `${Object.keys(data[key].player).length}/10`;

		li.appendChild(Name);
		li.appendChild(Owner);
		li.appendChild(People);
		let target = data[key].roomName;
		li.addEventListener("click", () => {
			selectRoom(`${target}`);
		});

		document.getElementsByClassName("room-list")[0].appendChild(li);
	}
});

socket.on("server-sendJoinRoomOK", (data) => {
	screenChange("game", "chat");

	gameTopUpdate(data);
	gameUserUpdate(data);
	gameLogInit(data);
	gameChatInit(data);
});

socket.on("server-sendMessage", (data) => {
	alert(data);
});

socket.on("server-sendUserUpdate", (data) => {
	gameUserUpdate(data);
});

socket.on("server-sendChatUpdate", (data) => {
	gameChatUpdate(data);
});

socket.on("server-sendLog", (data) => {
	gameLogUpdate(data);
});

socket.on("server-sendGameUpdate", (data) => {
	roomData = data;
	gameTopUpdate(data);
	gameUserUpdate(data);
})

socket.on("server-sendYouAreOwner", () => {
	isOwner = true;
	let button = document.createElement("button");
	button.id = "gameStart";
	button.innerHTML = "Game Start";
	button.addEventListener("click", () => {
		socket.emit("gameStart", currentRoom);
	});

	document.getElementById("time").innerHTML = "";
	document.getElementById("time").appendChild(button);
});

/**
 * 화면 바꿔주는 함수
 * @param {string} left 왼쪽에 들어갈거 id
 * @param {string} right 오른쪽에 들어갈거 id
 */
function screenChange(left, right) {
	document.getElementById("mkroom").style.display = "none";
	document.getElementById("joinroom").style.display = "none";
	document.getElementById("game").style.display = "none";
	document.getElementById("chat").style.display = "none";
	document.getElementById("room").style.display = "none";

	document.getElementById(left).style.display = "flex";
	document.getElementById(right).style.display = "flex";
}

/**
 * 방 만드는 함수 - 입력한 방 정보 서버로 던져줌
 * @returns 리턴 안해요 - form action 안하려고 넣음
 */
function makeRoom() {
	let roomName = document.getElementById("mkroomName").value;
	let password = document.getElementById("mkroomPassword").value;
	let ownerName = document.getElementById("mkownerName").value;

	let sendData = [roomName, password, ownerName];
	currentRoom = roomName;
	currentUserName = ownerName;
	socket.emit("makeNewRoom", sendData);

	return false;
}

/**
 * 방 선택하면 이름 / 비밀번호 입력창 띄워주는 함수
 * @param {script} target
 */
function selectRoom(target) {
	screenChange("joinroom", "room");
	currentRoom = target;
}

/**
 * 비밀번호 / 이름 입력한거 서버로 던져주는 함수
 * @returns 리턴 안해요 - form action 안하려고 넣음
 */
function joinroom() {
	let password = document.getElementById("jiroomPassword").value;
	let userName = document.getElementById("jiroomUsername").value;
	if (!(password == undefined || userName == undefined)) {
		currentUserName = userName;
		socket.emit("joinRoom", [currentRoom, password, userName]);
	}

	return false;
}

/**
 * 방 검색 기능
 */
function filter() {
	let search = document.getElementById("search").value.toLowerCase();
	let item = document.getElementsByClassName("room-item");

	for (let i = 0; i < item.length; i++) {
		let name = item[i].getElementsByClassName("room-name");
		let owner = item[i].getElementsByClassName("room-owner");

		if (name[0].innerText.toLowerCase().indexOf(search) != -1 || owner[0].innerText.toLowerCase().indexOf(search) != -1) {
			item[i].style.display = "flex";
			item[i].style.flexDirection = "column";
		} else {
			item[i].style.display = "none";
		}
	}
}

function sendChatting(data) {
	socket.emit("client-sendChatting", [currentRoom, currentUserName, data]);

	return false;
}

function gameTopUpdate(data) {
	document.getElementById("roomName").innerHTML = data.roomName;
	document.getElementById("time").innerHTML = data.time;
	if (document.getElementById("time").innerHTML == "Not Start Yet" && isOwner != true) {
		let button = document.createElement("button");
		button.id = "gameParticipate";
		button.innerHTML = "Game Participate";
		button.addEventListener("click", () => {
			socket.emit("gameParticipate", [currentRoom, socket.id]);
		});

		document.getElementById("time").innerHTML = "";
		document.getElementById("time").appendChild(button);
	} else if (document.getElementById("time").innerHTML == "Not Start Yet" && isOwner == true) {
		let button = document.createElement("button");
		button.id = "gameStart";
		button.innerHTML = "Game Start";
		button.addEventListener("click", () => {
			socket.emit("gameStart", currentRoom);
		});

		document.getElementById("time").innerHTML = "";
		document.getElementById("time").appendChild(button);
	}
	document.getElementById("currentMafiaCount").innerHTML = data.alivePeople.teamB;
}

function gameUserUpdate(data) {
	let users = document.getElementsByClassName("user");
	for (let i = 0; i < users.length; i++) {
		users[i].className = "user none";
	}

	for (let i = 0; i < Object.keys(data.player).length; i++) {
		users[i].children[0].innerHTML = data.player[Object.keys(data.player)[i]].nickname;
		users[i].children[1].innerHTML = data.player[Object.keys(data.player)[i]].alive;
		users[i].className = "user";
		if (data.player[Object.keys(data.player)[i]].alive == "DEAD") {
			users[i].className = "user dead";
		}
	}
}

function gameLogInit(data) {
	for (let i = 0; i < data.log.length; i++) {
		let li = document.createElement("li");

		li.innerHTML = data.log[i];
		li.className = "log";

		document.getElementById("logContent").appendChild(li);
	}
	let li = document.createElement("li");
	li.innerHTML = "===================";
	document.getElementById("logContent").appendChild(li);
}

function gameChatInit(data) {
	for (let i = 0; i < data.chats.length; i++) {
		let li = document.createElement("li");

		let name = document.createElement("span");
		name.innerHTML = data.chats[i].id;
		name.className = "chat-name";

		let content = document.createElement("span");
		content.innerHTML = data.chats[i].content;
		content.className = "chat-content";

		li.appendChild(name);
		li.appendChild(content);

		document.getElementById("chat-log").appendChild(li);
	}
	let li = document.createElement("li");
	li.innerHTML = "===================";
	document.getElementById("chat-log").appendChild(li);
}

function gameLogUpdate(data) {
	let content = data;

	let li = document.createElement("li");
	li.className = "log";
	li.innerHTML = content;

	document.getElementById("logContent").appendChild(li);
}

function gameChatUpdate(data) {
	let li = document.createElement("li");

	let name = document.createElement("span");
	name.innerHTML = data.id;
	name.className = "chat-name";

	let content = document.createElement("span");
	content.innerHTML = data.content;
	content.className = "chat-content";

	li.appendChild(name);
	li.appendChild(content);

	document.getElementById("chat-log").appendChild(li);
}
