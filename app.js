require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
const { sequelize } = require('./models/Comparison');

// Import routes
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Import middleware
const { isAuthenticated } = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// Session setup for flash messages
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-session-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 * 15 } // 15 minutes
}));
app.use(flash());

// Routes
app.use('/', authRoutes); // Auth routes don't need authentication
app.use('/users', userRoutes); // User routes have their own auth middleware
app.use('/', isAuthenticated, webRoutes); // Protect web routes
app.use('/api', isAuthenticated, apiRoutes); // Protect API routes

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    message: 'Something broke!',
    activeMenu: ''
  });
});

// Database sync and server start
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to sync database:', err);
  });