const mongoose = require('mongoose');
const dotenv = require('dotenv').config()
async function connect(req,res){
    mongoose.connect(process.env.MONGO_ATLAS)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
}
module.exports = connect