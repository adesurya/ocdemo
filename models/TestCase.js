const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { User } = require('./User');

class TestCase extends Model {}

TestCase.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Test case name is required'
      }
    }
  },
  evidencePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'evidence_path'
  },
  originalFilename: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'original_filename'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'file_size'
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_type'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'TestCase',
  tableName: 'test_cases',
  timestamps: true,
  underscored: true
});

// Define association with User model
TestCase.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

module.exports = { TestCase, sequelize };