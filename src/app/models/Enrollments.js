import Sequelize, { Model } from 'sequelize';
import { isBefore } from 'date-fns';

class Enrollments extends Model {
  static init(sequelize) {
    super.init(
      {
        student_id: Sequelize.INTEGER,
        plan_id: Sequelize.INTEGER,
        start_date: Sequelize.DATE,
        end_date: Sequelize.DATE,
        price: Sequelize.DECIMAL(3, 2),
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(this.date, new Date());
          }
        }
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
    this.belongsTo(models.Plans, { foreignKey: 'plan_id', as: 'plans' });
  }
}
export default Enrollments;
