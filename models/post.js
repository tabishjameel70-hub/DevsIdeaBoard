const mongoose = require('mongoose');

const postScehma = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // ✅ Fixed 'types' -> 'type'
        ref: 'user'
    },
    heading: String,
    content: String,
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId, // ✅ This one was already correct!
            ref: 'user'
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('post', postScehma);
