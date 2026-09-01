const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://tabishjameel62_db_user:xQ4ibALzJ5qEK65s@cluster0.m1suejy.mongodb.net/userapp?appName=Cluster0');
const userSchema = mongoose.Schema({
  username: {
    type: String
  },
  email: String,
  password: String,
  posts: [
    { type: mongoose.Schema.Types.ObjectId,
      ref: 'post'
     }
  ]
});
module.exports = mongoose.model('user', userSchema);