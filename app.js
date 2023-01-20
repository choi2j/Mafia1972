//server setting
const express = require('express');
const http = require('http');
const app = express();
const path = require('path');
const server = http.createServer(app);
const socketIO = require('socket.io');
const io = socketIO(server);
app.use(express.static(path.join(__dirname, 'src')));
const PORT = process.env.PORT || 5000;
const fs = require('fs');


//game variable
let roomList = [
    {
        roomName: 'asdf', 
        roomOwner: 'scvif', 
        roomPeople: [
            {
                id : undefined,
                nickname : 'scvif', //string
                job : undefined, //string ( mafia / citizen / doctor / police )
                team : undefined, //string ( A or B )
                alive : undefined //string ( observer / alive / dead )
            }
        ], 
        teamMemCount: {
            A : 0, //number
            B : 0 //number
        },
        roomPassword: '1234'
    },

    {
        roomName: 'qwer', 
        roomOwner: 'choi2j', 
        roomPeople: [
            {
                id : undefined,
                nickname : 'choi2j', //string
                job : undefined, //string
                team : undefined, //string (A or B)
                alive : undefined //boolrean
            }
        ], 
        teamMemCount: {
            A : 0, //number
            B : 0 //number
        },
        roomPassword: '1234'
    }, //테스트용 / 나중에 지워버릴 것
];
let userList = [

]
let indexBody = fs.readFileSync(__dirname + '\\src\\html\\index_body', 'utf8');

let listBody = fs.readFileSync(__dirname + '\\src\\html\\list_body', 'utf8');
let newRoomBody = fs.readFileSync(__dirname + '\\src\\html\\newRoom_body', 'utf8');
let roomBody = fs.readFileSync(__dirname + '\\src\\html\\room_body', 'utf8');

console.log(indexBody);


//socket code
io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);

    socket.emit('sendPage', indexBody);

    socket.on('login', (data) => {
        userList.push({username: data, id: socket.id});
        socket.emit('sendPage', listBody);
    })

    socket.on('newRoom', () => {
        socket.emit('sendPage', newRoomBody);
    })

    socket.on('reqRoomList', () => {
        socket.emit('resRoomList', roomList);
    })

    socket.on('roomChoice', (roomName) => {
        socket.join(roomName);
        console.log(socket.rooms);
        socket.emit('connectRoom', roomName);
    })

    socket.on('makeNewRoom', (data) => {
        roomList.push({
            roomName: data.roomName, 
            roomOwner: data.roomOwner, 
            roomPeople: [
                {
                    id : socket.id,
                    nickname : data.roomOwner, //string
                    job : undefined, //string
                    team : undefined, //string (A or B)
                    alive : undefined //boolrean
                }
            ], 
            teamMemCount: {
                A : 0, //number
                B : 0 //number
            },
            roomPassword: data.roomPassword
        })
        
        console.log(roomList);
        socket.emit('makeNewRoomOK');
        socket.join(data.roomName);
        console.log(socket.rooms);
        io.emit('resRoomList', roomList);
        
    })

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
    })

})


//server code
server.listen(PORT, () => {
    console.log(`server is running ${PORT}`);
})


//function