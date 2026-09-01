const express = require('express');
const app = express();
const path = require('path');
const jwt = require('jsonwebtoken');
const userModel = require('./models/user');
const postModel = require('./models/post');
const JWT = '123erwvdghlkyrtadeg##########jfrge478945645';
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const fs = require('fs');

app.get('/', isLoggined, (req, res) => {
    res.redirect('/home');
})
app.get('/signup', async (req, res) => {
    res.render('signup');
})
app.get('/home', isLoggined, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate('posts');
    if (user.length === 0) {
        res.cookie('token','');
        res.redirect('/signup')
    }
    res.render('home', { user });
})
app.post('/home', async (req, res) => {
    bcrypt.genSalt(10, function (err, salt) {
        const { username, email, password } = req.body;
        bcrypt.hash(password, salt, async (err, hash) => {
            // Store hash in your password DB.
            const createUser = await userModel.create({
                username,
                email,
                password: hash,
            })
            const token = jwt.sign({ email }, JWT);
            res.cookie('token', token);
            res.render('home', { user: createUser });
        });
    });
})
app.get('/logout', (req, res) => {
    res.cookie('token', '');
    res.redirect('signup')
})
app.get('/login', (req, res) => {
    res.render('login');
})
app.post('/login', async (req, res) => {
    // 1. Get email AND password from the login form
    const { email, password } = req.body;

    // 2. Find the user by the email they just typed in
    const user = await userModel.findOne({ email: email });
    if (!user) {
        return res.status(500).send('Something went wrong');
    }

    // 3. Compare the typed password with the user's saved password (user.password)
    bcrypt.compare(password, user.password, function (err, result) {
        if (err) {
            return res.status(500).send('Something went wrong');
        }

        if (result) {
            // 4. Give them their login token!
            const token = jwt.sign({ email: user.email }, JWT);
            res.cookie('token', token);

            // 5. Redirect to /home so it fetches the user data and renders home.ejs properly
            return res.status(200).redirect('/home');
        } else {
            return res.redirect('/login');
        }
    });
})
app.get('/profile', isLoggined, async (req, res) => {
    const user = await userModel.findOne({ email: req.user.email }).lean();
    console.log(user);
    res.render('profile', { user });
})
app.post('/create', isLoggined, async (req, res) => {
    try {
        const filter = { email: req.user.email };
        const update = {
            $set: {
                username: req.body.username,
                email: req.body.email,
            }
        };
        const options = {
            new: true,           // Returns the modified document instead of the original
            runValidators: true  // Ensures the updates match your Mongoose schema rules
        };
        const updatedUser = await userModel.findOneAndUpdate(filter, update, options);
        if (!updatedUser) {
            return res.status(404).send('User not found');
        }
        res.status(200).redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
})
app.post('/post', isLoggined, async (req, res) => {

    let user = await userModel.findOne({
        email: req.user.email
    });

    if (!user) {
        return res.status(404).send('User not found');
    }

    let { content, heading } = req.body;

    let post = await postModel.create({
        user: user._id,
        heading: heading,
        content: content
    });

    user.posts.push(post._id);

    await user.save();

    res.redirect('/home');
});
app.get('/addpost', isLoggined, async (req, res) => {
    res.render('addpost')
})
app.get('/feed', async (req, res) => {
    try {
        // Query the 'post' collection and populate the 'user' field
        const feed = await postModel.find()
            .populate('user')
            .sort({ createdAt: -1 });

        res.render('feed', { ideas: feed });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to load the feed");
    }
})
app.get('/like/:id', isLoggined, async (req, res) => {
    try {
        const post = await postModel.findOne({ _id: req.params.id }).populate('user');
        
        // Check if user has already liked the post
        if (post.likes.indexOf(req.user.userid) === -1) {
            // Like: Add user ID to the array
            post.likes.push(req.user.userid);
        } else {
            // Unlike: Remove user ID from the array
            post.likes.splice(post.likes.indexOf(req.user.userid), 1);
        }

        // Must await the save operation
        await post.save();
        
        // Redirect back to the page the user was just on
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating like status");
    }
});
function isLoggined(req, res, next) {
    if (req.cookies.token === '') {
        res.render('login')
    } else {
        let data = jwt.verify(req.cookies.token, JWT);
        req.user = data;
        next();
    }
}
app.listen(3000);
