/**
 * Setup script for OCR Comparison Application
 * Run: node setup.js
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== OCR Comparison App Setup ===\n');

// Create upload directories
console.log('Creating upload directories...');
const dirs = [
  './public/uploads/hpux',
  './public/uploads/linux'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
  
  // Create .gitkeep files
  fs.writeFileSync(path.join(dir, '.gitkeep'), '');
});

// Check if .env file exists, if not, create it from example
if (!fs.existsSync('./.env')) {
  console.log('\nCreating .env file...');
  
  rl.question('Enter MySQL host (default: localhost): ', (dbHost) => {
    dbHost = dbHost || 'localhost';
    
    rl.question('Enter MySQL username (default: root): ', (dbUser) => {
      dbUser = dbUser || 'root';
      
      rl.question('Enter MySQL password: ', (dbPass) => {
        
        rl.question('Enter MySQL database name (default: ocr_comparison): ', (dbName) => {
          dbName = dbName || 'ocr_comparison';
          
          rl.question('Enter OpenAI API key: ', (apiKey) => {
            
            rl.question('Enter application port (default: 3000): ', (port) => {
              port = port || '3000';
              
              const envContent = `# Application
PORT=${port}
NODE_ENV=development

# Database
DB_HOST=${dbHost}
DB_USER=${dbUser}
DB_PASS=${dbPass}
DB_NAME=${dbName}
DB_PORT=3306
DB_DIALECT=mysql

# OpenAI
OPENAI_API_KEY=${apiKey}

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
`;
              
              fs.writeFileSync('./.env', envContent);
              console.log('Created .env file with your configuration.');
              
              console.log('\nSetup completed successfully!');
              console.log('\nNext steps:');
              console.log('1. Run MySQL setup: mysql -u root -p < database-setup.sql');
              console.log('2. Install dependencies: npm install');
              console.log('3. Start the application: npm run dev\n');
              
              rl.close();
            });
          });
        });
      });
    });
  });
} else {
  console.log('.env file already exists. Skipping creation.');
  console.log('\nSetup completed!');
  rl.close();
}