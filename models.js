const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        trim: true
    },
    email: {
        type: String,
        require: true,
        trim: true
    },
    password: {
        type: String,
        require: true,
        trim: true
    }
})


const MessageSchema = new mongoose.Schema({
    date_of_message: {
        type: Date,
        default: Date.now
    },
    sender: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    content: {
        type: String,
        trim: true
    },
    room: {
        type: mongoose.Types.ObjectId,
        ref: 'Room'
    }
})


const RoomSchema = new mongoose.Schema({
    date_of_create: {
        type: Date,
        default: new Date
    },
    roomName: {
        type: String,
        required: true,
    },
    members: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'User'
        }
    ]
})

const User = mongoose.model('users', UserSchema)
const Message = mongoose.model('messages', MessageSchema)
const Room = mongoose.model('rooms', RoomSchema)
module.exports = {
    User,
    Message,
    Room
}