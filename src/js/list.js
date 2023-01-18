"use strict"

const socket = io();
socket.emit('reqRoomList');

socket.on('resRoomList', (data) => {
    let item;
    for(let i = 0; i < data.length; i++) {
        item = `
        <div class="room-item" id="${data[i].roomName}" onclick="'방 입장 함수'">
            <p class="text-medium room-name">${data[i].roomName}</p>
            <p class="text-small room-owner">${data[i].roomOwner}</p>
            <p class="text-small room-people">${data[i].roomPeople.length}/10</p>
        </div>
        `

        document.getElementsByClassName('room-ul')[0].appendChild(item);
    }
})