const router = require('express').Router()
const { index, addUser, getUsers } = require('./index.controller')

router.get('/', index)
router.post('/users', addUser)
router.get('/users', getUsers)


module.exports = router