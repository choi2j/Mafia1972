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


//SQL setting
const mysql = require('mysql');

var SQLconnection = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'serverUser',
    password: 'serverpassword'
})

SQLconnection.connect(function(err) {
    if(err) {
        console.error('error: ' + err.stack);
        return
    }

    console.log('connected as id ' + SQLconnection.threadId);
})

//game variable


//socket code
io.on('connection', (socket) => {
    socket.on('disconnection', () => {

    })
})


//server code
server.listen(PORT, () => {
    console.log(`server is running ${PORT}`);

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/src/html/index.html');
    })

    app.post('/list', (req, res) => {
        let username = req.query.name;
        res.sendFile(__dirname + '/src/html/list.html');
    })
})


//function