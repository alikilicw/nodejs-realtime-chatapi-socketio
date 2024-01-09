const mongoose = require('mongoose');
require("dotenv").config()
const dbURL = process.env.dbURL;

// Connect to MongoDB (replace below uri with your actual MongoDB URI)
mongoose.connect(`${dbURL}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});