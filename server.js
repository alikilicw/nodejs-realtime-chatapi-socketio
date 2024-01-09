// server.js
const express = require('express')
const cors = require('cors')
const app = express();
const { Server } = require('socket.io')
const { instrument } = require("@socket.io/admin-ui")


require("./dbConnection")
require("dotenv").config();

// Middlewares
app.use(cors());
app.use(express.json());
// app.use(express.static('public'));

const router = require("./router")
app.use('', router)

// Start the server
const port = process.env.PORT || 3500;
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

const { Room, User, Message } = require('./models')

//SOCKET IO
const io = new Server(server, {
    cors: {
        origin: ["https://admin.socket.io", "http://127.0.0.1:5500"],
        credentials: true
    }
});


// Socket.io event handling
io.on('connection', async (socket) => {
    console.log('A user connected');

    socket.on('get-chat-list', async (username, callback) => {

        try {
            const user = await User.findOne({username})

            if(!user) {
                throw new Error('User was not found.')
            }

            const rooms = await Room.find({members: user._id})
            var roomObjects = []
            
            for(let room of rooms) {

                // console.log(room);

                var roomObject = {}
                var placeholder = ''
                
                roomObject.roomName = room.roomName

                var i = 0
                for(let member of room.members) {
                    const user_ = await User.findById(member)

                    if(i == 3) {
                        placeholder += '...'
                        break;
                    }

                    if(!user._id.equals(member)) {
                        placeholder += `${user_.username} `
                    }

                    i++
                }

                roomObject.placeholder = placeholder
                roomObjects.push(roomObject)
            }

            const response = {
                roomObjects,
                status: true
            }

            callback(response)
        } catch(err) {
            callback(err.message, {status: false})
        }
    })

    socket.on('join-chat', async (data, callback) => {

        var receiver_username, message, room
        var context = {}
        
        var sender_username = data.sender_username

        try {
            const sender_user = await User.findOne({username: data.sender_username})
            if(!sender_user) throw new Error('Sender user was not found. Check sender username.')
            if(data.roomName) {

                const roomCheck = await Room.findOne({roomName: data.roomName})
                if(!roomCheck) {
                    throw new Error('Room was not found.')
                }

                room = data.roomName
                message = `Joined ${sender_username}`
                
                for(let member of roomCheck.members) {
                    if(!sender_user._id.equals(member)) {
                        const receiver_user = await User.findById(member)
                        receiver_username = receiver_user.username
                    }
                }

            } else {
                const receiver_user = await User.findOne({username: data.receiver_username})
                if(!receiver_user) throw new Error('Receiver user was not found.')

                receiver_username = data.receiver_username

                const roomCheck = await Room.find({members: {$all: [sender_user._id, receiver_user._id], $size: 2}})

                if(roomCheck.length != 0) {

                    room = roomCheck[0].roomName
                    
                    message = `Joined ${sender_username}`
                }else {

                    var date = new Date().toISOString()
                    date = date.replaceAll('-', '_')
                    date = date.replaceAll(':', '_')
                    var date = date.replaceAll('.', '_')


                    var room_ = new Room ({
                        roomName: date,
                        members: [
                            sender_user._id,
                            receiver_user._id
                        ]
                    })

                    await Room.create(room_)

                    room = room_.roomName

                    message = `Joined ${sender_username}`

                }
            }

            
            socket.join(room)
            
            socket.to(room).emit('joined-a-chat', {message})

            context = {
                room,
                sender_username,
                receiver_username,
                message
            }

            callback({context, status: true})

        } catch(err) {
            console.log(err);
            context.message = `${err}`
            callback({context, status: false})
        }

    })

    socket.on('get-messages', async (data, callback) => {
        const room = await Room.findOne({roomName: data.room}).select('_id')

        console.log(data);

        const page = data.page || 0
        const record_per_page = 3

        const messages = await Message.find({room: room._id})        
        .sort({date_of_message: -1})
        .skip(page * record_per_page)
        .limit(record_per_page)
        .select("-__v -room")

        const messages_ = []

        for(let message of messages) {messages_

            const sender = await User.findById(message.sender).select('username')

            const message_ = {
                _id: message._id,
                date_of_message: message.date_of_message,
                sender: sender.username,
                content: message.content
            }

            messages_.push(message_)
        }

        console.log(messages_);

        callback(messages_)

    })

    // Handle incoming messages
    socket.on('chatMessage', async (data) => {
        try {
            // console.log('chatMessage on', data);

            const sender_user = await User.findOne({username: data.sender_username}).select('_id')
            if(!sender_user) throw new Error('Sender user was not found.')

            const room = await Room.findOne({roomName: data.room}).select('_id')
            if(!room) throw new Error('Room was not found.')
    
            var message = new Message({
                sender: sender_user._id,
                content: data.content,
                room: room._id
            })

            const data_ = {
                sender_username: data.sender_username,
                content: data.content
            }
            // console.log(data_, 'chatMessageItem');
            await Message.create(message)
            socket.to(data.room).emit('response-message', data_)

        }catch(err) {
            console.log(err);
        }
    });

    socket.on('typing', (data) => {   
        socket.to(data.room).emit('typing')
    })

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

instrument(io, {
    auth: false,
    mode: 'development'
})