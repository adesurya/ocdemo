const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class NonISOComparison extends Model {}

NonISOComparison.init({
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
  hpuxEncoding: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'hpux_encoding'
  },
  linuxEncoding: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'linux_encoding'
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
  modelName: 'NonISOComparison',
  tableName: 'non_iso_comparisons',
  timestamps: true,
  underscored: true,
  // Don't define any indexes or foreign keys
  indexes: []
});

// Don't automatically create any associations
// We'll manually handle user lookups in the controller

module.exports = { NonISOComparison };