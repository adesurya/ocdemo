/**
 * Migration script to create default admin user
 * Run with: node migrations/create-admin-user.js
 */

require('dotenv').config();
const { User } = require('../models/User');
const { sequelize } = require('../models/Comparison');

async function createAdminUser() {
  try {
    console.log('Syncing database...');
    await sequelize.sync();
    
    console.log('Checking for existing admin user...');
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      console.log('Admin user already exists, skipping creation.');
      return;
    }
    
    console.log('Creating admin user...');
    await User.create({
      username: 'admin',
      password: 'admin123',  // Will be hashed by model hook
      name: 'Administrator',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active'
    });
    
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please login and change the password immediately.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

// Run the migration
createAdminUser();