const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { User } = require('./User');

class CSVComparison extends Model {}

CSVComparison.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  testCase: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'test_case'
  },
  hpuxFilePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'hpux_file_path'
  },
  linuxFilePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'linux_file_path'
  },
  hpuxFileName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'hpux_file_name'
  },
  linuxFileName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'linux_file_name'
  },
  hpuxData: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'hpux_data'
  },
  linuxData: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'linux_data'
  },
  differences: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  differenceCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'difference_count'
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
  modelName: 'CSVComparison',
  tableName: 'csv_comparisons',
  timestamps: true,
  underscored: true
});

// Define association with User model
CSVComparison.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

module.exports = { CSVComparison, sequelize };