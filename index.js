const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const faker = require('faker/locale/ru');
const moment = require('moment');

const app = express();

function checkAuth() {
  return app.use((req, res, next) => {
    if (req.user) {
      // next(req);
      next();
      // req;
    } else {
      res.status(401).send({ message: 'Need authentication' });
    }
  });
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: 'SIBLION', resave: false, saveUninitialized: false }))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
// Enable All CORS Requests
app.use(cors());

passport.use(
  new localStrategy((username, password, done) => {
    if (username !== 'test') {
      return done(null, false, {
        message: 'User not found',
      });
    } else if (password !== 'test') {
      return done(null, false, {
        message: 'Wrong password',
      });
    }
    return done(null, { id: 1, firstName: 'Test', lastName: 'Test', email: 'test@test.ru' });
  })
);

app.post(
  '/api/login',
  passport.authenticate('local'),
  function(req, res) {
    res.json({ id: 1, firstName: 'Test', lastName: 'Test', email: 'test@test.ru' });
  }
)

const categories = [
  'Кредит',
  'Гарантии',
  'Факторинг',
  'Лизинг',
  'Проектное финансирование',
  'Торговое финансирование',
];

app.put('/api/data', function(req, res) {
  const fromDate = new Date(req.body.fromDate);
  const toDate = new Date(req.body.toDate);

  const dateDiff = moment(fromDate).diff(moment(toDate), 'days') * -1;
  const totalAmount = faker.finance.amount(110000, 150000);
  const operationsCount = dateDiff + faker.datatype.number(10);
  
  let operations = [];
  let refill = 0;
  let debit = 0;

  for (let i = 1; i <= operationsCount; i++) {
    const debitOperation = faker.datatype.boolean();
    const operationDate = faker.date.between(fromDate, toDate);
    const authorizationCode = faker.finance.routingNumber();
    const transactionDescription = faker.finance.transactionDescription();
    const amount = faker.finance.amount(80000, 100000, 2);
    const categoryIndex = faker.datatype.number(5);
    
    debit += debitOperation ? Number(amount) : 0;
    refill += !debitOperation ? Number(amount) : 0;

    operations.push({
      operationDate: moment(operationDate).format(),
      processingDate: moment(operationDate).format(),
      authorizationCode,
      transactionDescription,
      category: categories[categoryIndex],
      amount: debitOperation ? Number(amount) : (0 - Number(amount)),
      balance: debitOperation ? (Number(totalAmount) + Number(amount)) : (Number(totalAmount) - Number(amount)),
    });
  }

  res.json({ amount: totalAmount, refill, debit, fromDate, toDate, operations });
});

app.listen(5000);