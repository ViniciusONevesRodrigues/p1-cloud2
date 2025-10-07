const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
require('dotenv').config();

const vehiclesRouter = require('./routes/vehicles');
const clientsRouter = require('./routes/clients');
const rentalsRouter = require('./routes/rentals');

const app = express();

app.engine('handlebars', exphbs.create({
  defaultLayout: 'main',
  helpers: {
    eq: (a, b) => a === b
  }
}).engine);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'secret123', resave: true, saveUninitialized: true }));
app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

app.get('/', (req, res) => res.render('index'));
app.use('/vehicles', vehiclesRouter);
app.use('/clients', clientsRouter);
app.use('/rentals', rentalsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
