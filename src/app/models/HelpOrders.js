import Sequelize, { Model } from 'sequelize';

class HelpOrders extends Model {
  static init(sequelize) {
    super.init(
      {
        student_id: Sequelize.INTEGER,
        question: Sequelize.TEXT,
        answer: Sequelize.TEXT,
        answer_at: Sequelize.DATE
      },
      {
        sequelize
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Students, {
      foreignKey: 'student_id',
      as: 'students'
    });
  }
}
export default HelpOrders;
