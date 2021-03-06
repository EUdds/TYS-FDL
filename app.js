require('dotenv').config();

const PORT = process.env.PORT || 1337;
const EXPRESS = require('express');
const EXPHBS = require('express-handlebars');
const BODY_PARSER = require('body-parser');
const HTTP = require('http');
const DB = require('diskdb');
const MULTER = require('multer');
const passwordProtect = require('express-password-protect');
const fs = require('fs');
DB.connect('./db', ['resturants', 'people']);

const upload = MULTER({dest: './assets/images'});

const APP = module.exports.app = EXPRESS();
const SERVER = HTTP.createServer(APP);

SERVER.listen(PORT, () => {
  console.log(`The pary is happening on ${PORT}, who do you know here?`);
});

APP.set('view engine', 'handlebars');
APP.engine('handlebars', EXPHBS({defaultLayout: 'main'}));

APP.use(EXPRESS.static('assets'));
APP.use(BODY_PARSER.urlencoded({extended: true}));

APP.get('*', (req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

APP.get('/', (req, res) => {
    let resList = DB.resturants.find();
    resList.sort(compare);
  res.render('welcome', {
    resturant: resList
  });
});

APP.post('/', (req, res) => {
    res.redirect('/insert');
});

APP.get('/add', (req, res) => {
    res.render('add');
});

APP.get('/tip', (req, res) => {
    let resturant = req.query.q;
    let place = DB.resturants.findOne({shortName: resturant});
    //console.log(place);
    let people = DB.people.find({place: resturant});
    res.render('tip', {
        place: place,
        people: people
    });
});

APP.get('/tipatrandom', (req, res) => {
    let randomPerson, resturant;
    if (!req.query.q) {
    let N = DB.people.count();
    let r = Math.floor(Math.random() * N);
    let list = DB.people.find();
    //console.log(list);
     randomPerson = list[r];
     resturant = DB.resturants.findOne({shortName: randomPerson.place});
    //console.log(randomPerson);
    } else {
        let list = DB.people.find({place: req.query.q});
        resturant = DB.resturants.findOne({shortName: req.query.q});
        randomPerson = list[Math.floor(Math.random() * list.length)];
    }
    res.render('randomTip', {
        person: randomPerson,
        resturant: resturant
    });
});

APP.get('/faq', (req, res) => {
    res.render('faq');
})

// Password Protected Routes
const config = {
    username: 'dev',
    password: 'dev',
    maxAge: 600000 // 10 Minutes
};

// APP.use(passwordProtect(config));

APP.get('/insert', (req, res) => {
    res.render('adminAdd');
});


APP.post('/insert/resturant', upload.single('img'), (req, res) => {
    let longName = req.body.longName;
    let shortName = req.body.shortName;
    let img = req.file;
    fs.rename('assets/images/' + req.file.filename, 'assets/images/' + shortName +'.png', (err) => {
        if (err) console.error(err);
    });
    let resturant = {
        longName: longName,
        shortName: shortName
    };
    DB.resturants.save(resturant);

    res.redirect('/');
});

APP.post('/insert/person',upload.none(), (req, res) => {
    let venmo = req.body.venmo;
    let paypal = req.body.paypal;
    let cashapp = req.body.cashapp; 
    let role = req.body.role;
    let name = req.body.Name;
    let place = req.body.place;
    let person = {
        name: name,
        place: place,
        role: role,
        venmo: venmo,
        paypal: paypal,
        cashapp: cashapp
    };
    DB.people.save(person);
    res.redirect('/');
});
/**
 * Sorts resturants based on the first character of their longName
 * @param {Resturant} a First resturant to compare
 * @param {Resturant} b Second resturant to compare
 */
function compare(a, b) {
    console.log(a);
    console.log(b);
    let result = a.longName.charAt(0) > b.longName.charAt(0);
    if (result) return 1;
    else return -1;
}
