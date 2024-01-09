const { reset } = require('nodemon')
const {User, Room} = require('./models')
 
const index = async (req, res) => {
    var date = new Date().toISOString()
    date = date.replaceAll('-', '_')
    date = date.replaceAll(':', '_')
    date = date.replaceAll('.', '_')
    console.log(date);
    return res.send({'message': 'OK.'})
} 


const addUser = async (req, res) => {
    const user = new User (req.body.user)
    await user.save()

    return res.send({'message': 'OK.'})
}

const getUsers = async (req, res) => {
    try {
        const user = await User.findOne({username: req.query.username})

        const receiver_id_list = await Room.find({members: {$all: user._id}})
    
        console.log(receiver_id_list, 'user_id_list');
    }catch(err) {
        return res.send({'message': 'Hata.'})
    }

}
 
module.exports = {
    index,
    addUser,
    getUsers
}