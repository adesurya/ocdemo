const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { User } = require('./User');

class Scenario extends Model {}

Scenario.init({
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
        msg: 'Folder name is required'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_id',
    references: {
      model: 'scenarios',
      key: 'id'
    }
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '/'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  isFolder: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_folder'
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_path'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'file_size'
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_type'
  },
  originalFilename: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'original_filename'
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
  modelName: 'Scenario',
  tableName: 'scenarios',
  timestamps: true,
  underscored: true
});

// Self-reference for parent-child relationship
Scenario.belongsTo(Scenario, { 
  as: 'parent',
  foreignKey: 'parentId'
});

Scenario.hasMany(Scenario, { 
  as: 'children',
  foreignKey: 'parentId'
});

// User relationship
Scenario.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'owner'
});

module.exports = { Scenario, sequelize };