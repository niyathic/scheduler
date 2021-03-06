var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
//var cookieSession = require('cookie-session');
var isAuthenticated = require('./middlewares/isAuthenticated');
var mongoose = require('mongoose');
var User = require('./models/user');
var Event = require('./models/event');
var Timeslot = require('./models/timeslot');
var nodemailer = require('nodemailer');
//var accountRoutes = require('./routes/account');

var app = express();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wefree') //mongoose connect call

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // to accept post data from ajax requests
//app.use('/static', express.static(path.join(__dirname, 'static')));

// serve files from the public directory
app.use(express.static('public'));

app.listen(process.env.PORT || 3000, function () {
    console.log('App listening on port ' + (process.env.PORT || 3000))
})

// set the express view engine to take care of ejs within html files
app.engine('html', require('ejs').__express);

app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'html');
//todo cookie session?

//app.use('/account', accountRoutes);


app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

app.post('/', isAuthenticated, function (req, res, next) {
    return;
});

// TODO DELETE IF ROUTING THROUGH ACCOUNT

// Signup
app.get('/signup', function (req, res, next) {
    // debug check for all signed up users
    User.find({}, function (err, results) {
        console.log(results);
    })
    res.render('signup');
});

app.post('/signup', function (req, res, next) {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const googleIntegrated = req.body.googleIntegrated.checked;
    const user = new User({ name: name, email: email, password: password, googleIntegrated: googleIntegrated, events: [] });
    var mailOptions = {
        from: 'wefree.scheduler@gmail.com',
        to: email,
        subject: 'Thanks for joining WeFree!',
        html: '<h1>Welcome to WeFree!</h1><p>We are so excited that you\'ve joined us. With WeFree, you can <b>schedule group events with ease</b>. If you are receiving this email by mistake, <a href="/delete">let us know</a>.</p>'
    };
    user.save(function (err, results) {
        if (!err) {
            // send email confirming signup
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.redirect('/');
            return;
        } else {
            res.send(err.message);
            return;
        }
    })
})

// Login
app.get('/login', function (req, res, next) {
    res.render('login');
})
app.post('/login', function (req, res, next) {
    const email = req.body.email;
    const password = req.body.password;
    console.log(req.body);
    User.findOne({ email: email, password: password }, function (err, result) {
        if (err) {
            res.send('An error occurred: ' + err.message);
            return;
        } if (!result) {
            req.session.isAuthenticated = false;
            res.send('Incorrect credentials. Please try again.');
            return;
        } if (result.password === password) {
            req.session.user = result.username;
            req.session.isAuthenticated = true;
            res.redirect('/');
            return;
        }
    })
})

// Logout
app.get('/logout', isAuthenticated, function (req, res, next) {
    req.session.user = '';
    res.redirect('/');
})

// Delete account
app.get('/delete', function (req, res, next) {
    res.render('delete');
})

app.post('/delete', function (req, res, next) {
    if (User.findOne({ email: req.body.deleteEmail })) {
        User.remove({ email: req.body.deleteEmail });
    }
    return;
})

// Transporter for nodemailer - to send signup confirmation email
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'wefree.scheduler@gmail.com',
        pass: 'whittaker'
    }
});



app.use(function (err, req, res, next) {
    return res.send('ERROR :  ' + err.message)
})

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '/public', 'index.html'));
});
