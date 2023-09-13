const mongoose = require('mongoose');
async function connect(req,res){
    mongoose.connect('mongodb+srv://sirajju:242424@cluster0.xhhl5g0.mongodb.net/test')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
}
module.exports = connect