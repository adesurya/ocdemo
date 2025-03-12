require('dotenv').config();
const mysql = require('mysql2/promise');

async function initializeDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    console.log('Connected to database');
    
    // Create non_iso_comparisons table
    console.log('Creating non_iso_comparisons table...');
    await connection.execute(`
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
    
    console.log('Non-ISO comparisons table created successfully');
    
    // Create upload directories if needed
    const fs = require('fs');
    const path = require('path');
    
    const uploadDir = path.join(__dirname, 'uploads/non-iso-comparison');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created uploads directory:', uploadDir);
    }
    
    console.log('Database initialization complete!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the initialization
initializeDatabase();