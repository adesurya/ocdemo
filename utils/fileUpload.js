const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const hpuxDir = path.join(__dirname, '../public/uploads/hpux');
const linuxDir = path.join(__dirname, '../public/uploads/linux');

if (!fs.existsSync(hpuxDir)) {
  fs.mkdirSync(hpuxDir, { recursive: true });
}

if (!fs.existsSync(linuxDir)) {
  fs.mkdirSync(linuxDir, { recursive: true });
}

// Define storage options for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on the field name
    if (file.fieldname === 'hpuxImage') {
      cb(null, hpuxDir);
    } else if (file.fieldname === 'linuxImage') {
      cb(null, linuxDir);
    } else {
      cb(new Error('Invalid field name for file upload'));
    }
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880 // 5MB default
  },
  fileFilter: fileFilter
});

module.exports = {
  uploadMiddleware: upload.fields([
    { name: 'hpuxImage', maxCount: 1 },
    { name: 'linuxImage', maxCount: 1 }
  ])
};