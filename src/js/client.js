const socket = io();

let currentRoom;




socket.on("server-sendRoomList", (data) => {
	document.getElementsByClassName("room-list")[0].innerHTML = '';

	let li, Name, Owner, People;
	for (let i = 0; i < data.length; i++) {
		li = document.createElement("li");
		li.className = "room-item";

		Name = document.createElement("p");
		Name.className = "text-big room-name";
		Name.innerHTML = data[i].roomName;

		Owner = document.createElement("p");
		Owner.className = "text-small room-owner";
		Owner.innerHTML = data[i].roomOwner;

		People = document.createElement("p");
		People.className = "text-small room-cap";
		People.innerHTML = `${data[i].roomPeople.length}/10`;

		li.appendChild(Name);
		li.appendChild(Owner);
		li.appendChild(People);
		li.addEventListener('click', () => {
			selectRoom(data[i].roomName);
		})

		document.getElementsByClassName("room-list")[0].appendChild(li);
	}
});

function makeRoom() {
	let roomName = document.getElementById('mkroomName').value;
	let password = document.getElementById('mkroomPassword').value;
	let ownerName = document.getElementById('mkownerName').value;

	let sendData = [roomName, password, ownerName];
	socket.emit('makeNewRoom', sendData);

	return false;
}

function selectRoom(target) {
	document.getElementById('mkroom').style.display = 'none';
	document.getElementById('password').style.display = 'flex';
	document.getElementById('name').style.display = 'flex';
	console.log(target);
	currentRoom = target;
}

function joinroom() {
	let password = document.getElementById('jiroomPassword').value;
	let userName = document.getElementById('jiroomUsername').value;
	socket.emit('joinRoom', [currentRoom, password, userName]);

	return false;
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
