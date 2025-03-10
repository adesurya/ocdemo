const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { User } = require('./User');
const { Scenario } = require('./Scenario');

class ScenarioShare extends Model {}

ScenarioShare.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  scenarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'scenario_id',
    references: {
      model: 'scenarios',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  permissionLevel: {
    type: DataTypes.ENUM('read', 'edit', 'admin'),
    allowNull: false,
    defaultValue: 'read',
    field: 'permission_level'
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
  modelName: 'ScenarioShare',
  tableName: 'scenario_shares',
  timestamps: true,
  underscored: true
});

// Define associations
ScenarioShare.belongsTo(Scenario, { foreignKey: 'scenarioId' });
ScenarioShare.belongsTo(User, { foreignKey: 'userId' });

// Add the reverse associations
Scenario.hasMany(ScenarioShare, { foreignKey: 'scenarioId' });
User.hasMany(ScenarioShare, { foreignKey: 'userId' });

module.exports = { ScenarioShare, sequelize };