const http = require('node:http');
const express = require('express');
const { Server: socketServer } = require('socket.io');
//import socketServer from 'socket.io';
const os = require('os');
const pty = require('node-pty');
//node-pty for creating a terminal

const app = express();
const server = http.createServer(app);

const io = new socketServer(server, {
    cors: {
        //cors for frontend issue
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
    }
});

// Define shell before using it
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.INIT_CWD, //current working directory from HOME
    env: process.env
});

// Event listeners
ptyProcess.onData(data => {
    io.emit('terminal:data', data); //sending data to terminal user bridge created 
});

ptyProcess.on('error', (err) => {
    console.log('PTY process error:', err);
});

io.on('connection', (socket) => {
    console.log('socket connected ', socket.id);//connection for socket

    socket.on('terminal:write', (data) => {//writing to terminal send to  ptyProcess    
        ptyProcess.write(data);
    });

    socket.on('error', (err) => {
        console.log('socket error', err);
    });
});
//updating to be a docker server
server.listen(3000, () => console.log('server is running on port 3000'));
