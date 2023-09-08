const mongoose = require('mongoose');
async function connect(req,res){
    mongoose.connect('mongodb://127.0.0.1:27017/test')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
}
module.exports = connect