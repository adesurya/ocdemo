require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
const { sequelize } = require('./models/Comparison');
const viewHelpers = require('./utils/viewHelpers');
const fs = require('fs');

// Import routes
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const testCaseRoutes = require('./routes/testCase');
const csvComparisonRoutes = require('./routes/csvComparison'); // Import CSV comparison routes
const nonIsoComparisonRoutes = require('./routes/nonIsoComparison');

// Import middleware
const { isAuthenticated } = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const csvComparisonDir = path.join(uploadsDir, 'csv-comparison');
const nonIsoComparisonDir = path.join(uploadsDir, 'non-iso-comparison');

const scenarioRoutes = require('./routes/scenario');


if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(csvComparisonDir)) {
  fs.mkdirSync(csvComparisonDir);
}

if (!fs.existsSync(nonIsoComparisonDir)) {
  fs.mkdirSync(nonIsoComparisonDir);
}

// Set up template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Expose uploads directory
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use('/scenarios', isAuthenticated, scenarioRoutes);


// Session setup for flash messages
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-session-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 * 30 } // 30 minutes
}));
app.use(flash());

// Make flash messages available to all views, but only if they exist
app.use((req, res, next) => {

  // Flash messages dari session
  const successFlash = req.flash('success');
  const errorFlash = req.flash('error');
  
  // Hanya set di locals jika memang ada isinya
  if (successFlash && successFlash.length > 0) {
    res.locals.success = successFlash;
  }
  
  if (errorFlash && errorFlash.length > 0) {
    res.locals.error = errorFlash;
  }
  
  // Add view helpers to res.locals
  res.locals.formatFileSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };  res.locals.formatDate = viewHelpers.formatDate;
  
  next();
});

// Auth middleware for setting user in res.locals
app.use(async (req, res, next) => {
  // Jika req.user sudah di-set oleh middleware sebelumnya
  if (req.user) {
    res.locals.user = req.user;
  }
  next();
});

// Routes
app.use('/', authRoutes); // Auth routes don't need authentication
app.use('/users', userRoutes); // User routes have their own auth middleware
app.use('/test-cases', testCaseRoutes); // Add test case routes
app.use('/csv-comparison', csvComparisonRoutes); // Add CSV comparison routes
app.use('/non-iso-comparison', nonIsoComparisonRoutes); // Add non-ISO comparison routes
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

const createNonIsoTable = async () => {
  try {
    // Use raw query to create table without modifying existing tables
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS non_iso_comparisons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_case VARCHAR(255) NOT NULL,
        hpux_file_path VARCHAR(255) NOT NULL,
        linux_file_path VARCHAR(255) NOT NULL,
        hpux_file_name VARCHAR(255) NOT NULL,
        linux_file_name VARCHAR(255) NOT NULL,
        hpux_encoding VARCHAR(50),
        linux_encoding VARCHAR(50),
        differences LONGTEXT,
        difference_count INT NOT NULL DEFAULT 0,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('non_iso_comparisons table created or already exists');
  } catch (error) {
    console.error('Error creating non_iso_comparisons table:', error);
  }
};

// Modified database sync with { alter: false } to prevent modifying existing tables
sequelize.sync({ alter: false })
  .then(async () => {
    console.log('Database connected successfully');
    
    // Create non_iso_comparisons table separately
    await createNonIsoTable();
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to database:', err);
  });