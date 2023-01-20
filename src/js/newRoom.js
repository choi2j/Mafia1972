"use strict"

function newRoom() {
    let roomName = document.getElementById('roomName').value;
    let owner = document.getElementById('roomOwner').value;
    let password = document.getElementById('roomPassword').value;

    let roomInfoConfirm = confirm(`아래의 내용이 맞나요?
    이름: ${roomName}
    비밀번호: ${password}`);

    if (roomInfoConfirm == true) {
        socket.emit('makeNewRoom', {roomName: roomName, roomOwner: owner, roomPassword: password});
    }
    

}


let userName;