"use strict"


console.log(socket);

socket.on('session', (data) => {
    console.log(data);
})

socket.emit('reqRoomList');

socket.on('resRoomList', (data) => {
    let div, Name, Owner, People;
    let item;
    for(let i = 0; i < data.length; i++) {
        div = document.createElement('div');
        div.className = 'room-item';
        div.id = data[i].roomName;
        

        Name = document.createElement('p');
        Name.className = 'text-medium room-name'
        Name.innerHTML = data[i].roomName;

        Owner = document.createElement('p');
        Owner.className = "text-small room-owner"
        Owner.innerHTML = data[i].roomOwner;

        People = document.createElement('p');
        People.className = "text-small room-people";
        People.innerHTML = `${data[i].roomPeople.length}/10`;

        div.appendChild(Name);
        div.appendChild(Owner);
        div.appendChild(People);
        div.addEventListener("click", joinroom);

        document.getElementsByClassName('room-ul')[0].appendChild(div);
    }
})

function joinroom(target) {
    socket.emit('roomChoice', this.id);
}