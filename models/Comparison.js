const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Comparison extends Model {}

Comparison.init({
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
  hpuxImagePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'hpux_image_path'
  },
  linuxImagePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'linux_image_path'
  },
  hpuxExtractedData: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'hpux_extracted_data'
  },
  linuxExtractedData: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'linux_extracted_data'
  },
  differences: {
    type: DataTypes.TEXT('long'),
    allowNull: true
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
  modelName: 'Comparison',
  tableName: 'comparisons',
  timestamps: true,
  underscored: true
});

module.exports = { Comparison, sequelize };