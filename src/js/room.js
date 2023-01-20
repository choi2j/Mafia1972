"use strict"



socket.on('receiveLog', (data) => {
    let li = document.createElement('li');
    li.innerHTML = data;

    document.querySelector('#log > ul').appendChild(li);
})

socket.on('receiveChat', (data) => {
    let li = document.createElement('li');
    li.innerHTML = data;

    document.querySelector('#chat > ul').appendChild(li);
})