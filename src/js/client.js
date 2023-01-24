const socket = io();

let currentRoom;






socket.on("session", (data) => {
	console.log(data);
});

socket.on("resRoomList", (data) => {
	let div, Name, Owner, People;
	let item;
	for (let i = 0; i < data.length; i++) {
		div = document.createElement("div");
		div.className = "room-item";
		div.id = data[i].roomName;

		Name = document.createElement("p");
		Name.className = "text-medium room-name";
		Name.innerHTML = data[i].roomName;

		Owner = document.createElement("p");
		Owner.className = "text-small room-owner";
		Owner.innerHTML = data[i].roomOwner;

		People = document.createElement("p");
		People.className = "text-small room-people";
		People.innerHTML = `${data[i].roomPeople.length}/10`;

		div.appendChild(Name);
		div.appendChild(Owner);
		div.appendChild(People);
		div.addEventListener("click", joinroom);

		document.getElementsByClassName("room-ul")[0].appendChild(div);
	}
});

function makeRoom() {
	let roomName = document.getElementById('newRoomName');
	let password = document.getElementById('newRoomPassword');
	let ownerName = document.getElementById('ownerName');

	let sendData = [roomName, password, ownerName];

	socket.emit('makeNewRoom', sendData);
}




function selectRoom(target) {
	document.getElementById('mkroom').style.display = 'none';
	document.getElementById('password').style.display = 'flex';
	document.getElementById('name').style.display = 'flex';
	console.log(target);
	currentRoom = target;
}

/**
 *
 * @param {string} name GET 파라미터
 * @returns GET 파라미터 값
 */
function getParameter(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
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
